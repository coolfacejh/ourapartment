-- ================================================
-- 우리단지토크 MVP - Supabase Schema + RLS
-- 실행 위치: Supabase Dashboard > SQL Editor
-- ================================================

-- 확장 모듈
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ================================================
-- 1. TABLES
-- ================================================

-- 단지 테이블
CREATE TABLE complexes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  signup_code     TEXT UNIQUE NOT NULL,
  total_households INT NOT NULL DEFAULT 100,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 사용자 테이블 (auth.users 확장)
CREATE TABLE users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  complex_id  UUID NOT NULL REFERENCES complexes(id),
  dong        TEXT NOT NULL,
  ho_hash     TEXT NOT NULL,  -- AES 암호화 저장 (crypt() 사용)
  nickname    TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 게시글 테이블
CREATE TABLE posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id  UUID NOT NULL REFERENCES complexes(id),
  user_id     UUID NOT NULL REFERENCES users(id),
  category    TEXT NOT NULL CHECK (category IN ('주차','흡연','소음','시설','기타')),
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'general'
              CHECK (status IN ('general','petition','resolved')),
  view_count  INT DEFAULT 0,
  is_blinded  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 이미지 테이블 (게시글 다중 이미지)
CREATE TABLE images (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 댓글 테이블
CREATE TABLE comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id),
  body        TEXT NOT NULL,
  is_blinded  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 공감 테이블 (게시글 + 댓글 통합)
CREATE TABLE reactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK (target_type IN ('post','comment')),
  target_id   UUID NOT NULL,
  user_id     UUID NOT NULL REFERENCES users(id),
  type        TEXT NOT NULL DEFAULT 'like',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (target_type, target_id, user_id)
);

-- 청원 테이블
CREATE TABLE petitions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL UNIQUE REFERENCES posts(id),
  target_rate NUMERIC(5,2) NOT NULL DEFAULT 10.00,  -- 목표 동의율(%)
  status      TEXT NOT NULL DEFAULT 'active'
              CHECK (status IN ('active','achieved','submitted')),
  summary     TEXT,
  deadline    DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 청원 투표 테이블
CREATE TABLE petition_votes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  petition_id UUID NOT NULL REFERENCES petitions(id),
  user_id     UUID NOT NULL REFERENCES users(id),
  vote        TEXT NOT NULL CHECK (vote IN ('agree','disagree')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (petition_id, user_id)
);

-- 신고 테이블
CREATE TABLE reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK (target_type IN ('post','comment')),
  target_id   UUID NOT NULL,
  reporter_id UUID NOT NULL REFERENCES users(id),
  reason      TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending','blinded','reviewing','resolved','deleted')),
  blinded_at  TIMESTAMPTZ,
  notified_at TIMESTAMPTZ,  -- 정통망법: 게시자 통보 시각
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 운영자 테이블
CREATE TABLE complex_operators (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id),
  complex_id  UUID NOT NULL REFERENCES complexes(id),
  role        TEXT NOT NULL DEFAULT 'admin',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, complex_id)
);

-- ================================================
-- 2. VIEWS
-- ================================================

-- 청원 집계 뷰 (current_agree/disagree 실시간 계산)
CREATE VIEW petition_stats AS
SELECT
  p.id AS petition_id,
  p.post_id,
  p.target_rate,
  p.status,
  p.summary,
  p.deadline,
  c.total_households,
  COUNT(CASE WHEN pv.vote = 'agree' THEN 1 END) AS agree_count,
  COUNT(CASE WHEN pv.vote = 'disagree' THEN 1 END) AS disagree_count,
  COUNT(pv.id) AS total_votes,
  ROUND(COUNT(pv.id)::NUMERIC / NULLIF(c.total_households, 0) * 100, 2) AS participation_rate
FROM petitions p
JOIN posts po ON p.post_id = po.id
JOIN complexes c ON po.complex_id = c.id
LEFT JOIN petition_votes pv ON p.id = pv.petition_id
GROUP BY p.id, p.post_id, p.target_rate, p.status, p.summary, p.deadline, c.total_households;

-- ================================================
-- 3. INDEXES
-- ================================================

CREATE INDEX idx_posts_complex_id    ON posts(complex_id);
CREATE INDEX idx_posts_status        ON posts(status);
CREATE INDEX idx_posts_category      ON posts(category);
CREATE INDEX idx_posts_created_at    ON posts(created_at DESC);
CREATE INDEX idx_comments_post_id    ON comments(post_id);
CREATE INDEX idx_reactions_target    ON reactions(target_type, target_id);
CREATE INDEX idx_petition_votes_pid  ON petition_votes(petition_id);
CREATE INDEX idx_reports_status      ON reports(status);

-- ================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ================================================

-- RLS 활성화
ALTER TABLE complexes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE images           ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE petitions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE petition_votes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports          ENABLE ROW LEVEL SECURITY;
ALTER TABLE complex_operators ENABLE ROW LEVEL SECURITY;

-- Helper function: 현재 유저의 complex_id 반환
CREATE OR REPLACE FUNCTION get_my_complex_id()
RETURNS UUID AS $$
  SELECT complex_id FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function: 현재 유저가 특정 단지의 운영자인지 확인
CREATE OR REPLACE FUNCTION is_operator(cid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM complex_operators
    WHERE user_id = auth.uid() AND complex_id = cid
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- complexes: 자신의 단지만 조회
CREATE POLICY "users can view their complex"
  ON complexes FOR SELECT
  USING (id = get_my_complex_id());

-- users: 같은 단지 유저 조회 (ho_hash는 본인만)
CREATE POLICY "users can view same complex users"
  ON users FOR SELECT
  USING (complex_id = get_my_complex_id());

CREATE POLICY "users can insert own record"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "users can update own record"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- posts: 같은 단지, 블라인드 아닌 글만 조회
CREATE POLICY "users view posts in their complex"
  ON posts FOR SELECT
  USING (complex_id = get_my_complex_id() AND is_blinded = FALSE);

CREATE POLICY "users can create posts"
  ON posts FOR INSERT
  WITH CHECK (complex_id = get_my_complex_id() AND user_id = auth.uid());

CREATE POLICY "users can update own posts"
  ON posts FOR UPDATE
  USING (user_id = auth.uid());

-- 운영자: 모든 글 조회 (블라인드 포함)
CREATE POLICY "operators view all posts"
  ON posts FOR SELECT
  USING (is_operator(complex_id));

-- images: 게시글과 동일한 단지
CREATE POLICY "users view images in complex"
  ON images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = images.post_id
      AND posts.complex_id = get_my_complex_id()
    )
  );

CREATE POLICY "users can insert images for own posts"
  ON images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = images.post_id
      AND posts.user_id = auth.uid()
    )
  );

-- comments: 같은 단지, 블라인드 아닌 댓글
CREATE POLICY "users view comments in complex"
  ON comments FOR SELECT
  USING (
    is_blinded = FALSE AND
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = comments.post_id
      AND posts.complex_id = get_my_complex_id()
    )
  );

CREATE POLICY "users can create comments"
  ON comments FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = comments.post_id
      AND posts.complex_id = get_my_complex_id()
    )
  );

-- reactions: 같은 단지 조회 가능
CREATE POLICY "users view reactions"
  ON reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = reactions.user_id
      AND users.complex_id = get_my_complex_id()
    )
  );

CREATE POLICY "users can manage own reactions"
  ON reactions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- petitions: 같은 단지
CREATE POLICY "users view petitions in complex"
  ON petitions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = petitions.post_id
      AND posts.complex_id = get_my_complex_id()
    )
  );

CREATE POLICY "post owner can create petition"
  ON petitions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = petitions.post_id
      AND posts.user_id = auth.uid()
    )
  );

-- petition_votes: 본인 투표만 조회, 집계는 뷰로
CREATE POLICY "users can view own vote"
  ON petition_votes FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "users can vote once"
  ON petition_votes FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- reports: 본인 신고만 조회, 운영자는 전체
CREATE POLICY "users view own reports"
  ON reports FOR SELECT
  USING (reporter_id = auth.uid());

CREATE POLICY "operators view all reports"
  ON reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN complex_operators co ON co.user_id = u.id
      WHERE u.id = auth.uid()
    )
  );

CREATE POLICY "users can submit reports"
  ON reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

-- complex_operators: 운영자 본인만 조회
CREATE POLICY "operators view own role"
  ON complex_operators FOR SELECT
  USING (user_id = auth.uid());

-- ================================================
-- 5. 신고 자동 블라인드 함수
-- ================================================

CREATE OR REPLACE FUNCTION auto_blind_on_reports()
RETURNS TRIGGER AS $$
DECLARE
  report_count INT;
  threshold INT := 5;  -- 5회 신고 시 자동 블라인드
BEGIN
  SELECT COUNT(*) INTO report_count
  FROM reports
  WHERE target_type = NEW.target_type
    AND target_id = NEW.target_id
    AND status = 'pending';

  IF report_count >= threshold THEN
    IF NEW.target_type = 'post' THEN
      UPDATE posts SET is_blinded = TRUE WHERE id = NEW.target_id;
    ELSIF NEW.target_type = 'comment' THEN
      UPDATE comments SET is_blinded = TRUE WHERE id = NEW.target_id;
    END IF;

    UPDATE reports
    SET status = 'blinded', blinded_at = NOW()
    WHERE target_type = NEW.target_type AND target_id = NEW.target_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_auto_blind
  AFTER INSERT ON reports
  FOR EACH ROW EXECUTE FUNCTION auto_blind_on_reports();

-- ================================================
-- 6. 청원 목표 달성 자동 상태 변경 함수
-- ================================================

CREATE OR REPLACE FUNCTION check_petition_achievement()
RETURNS TRIGGER AS $$
DECLARE
  v_petition_id UUID;
  v_total_households INT;
  v_target_rate NUMERIC;
  v_vote_count INT;
  v_participation_rate NUMERIC;
BEGIN
  SELECT p.id, c.total_households, p.target_rate
  INTO v_petition_id, v_total_households, v_target_rate
  FROM petitions p
  JOIN posts po ON p.post_id = po.id
  JOIN complexes c ON po.complex_id = c.id
  WHERE p.id = NEW.petition_id AND p.status = 'active';

  IF NOT FOUND THEN RETURN NEW; END IF;

  SELECT COUNT(*) INTO v_vote_count
  FROM petition_votes WHERE petition_id = v_petition_id;

  v_participation_rate := v_vote_count::NUMERIC / NULLIF(v_total_households, 0) * 100;

  IF v_participation_rate >= v_target_rate THEN
    UPDATE petitions SET status = 'achieved' WHERE id = v_petition_id;
    UPDATE posts SET status = 'petition' WHERE id = (
      SELECT post_id FROM petitions WHERE id = v_petition_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_check_petition
  AFTER INSERT ON petition_votes
  FOR EACH ROW EXECUTE FUNCTION check_petition_achievement();

-- ================================================
-- 7. 초기 데이터 (테스트용)
-- ================================================

INSERT INTO complexes (name, signup_code, total_households)
VALUES ('상록수 아파트', 'SANGNOK2024', 500);
