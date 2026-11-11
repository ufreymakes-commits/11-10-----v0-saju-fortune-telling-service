-- 궁합 v2 (v27) — 실행 전 아래 "0. 확인" 쿼리 결과를 먼저 보고 알려 주세요.

-- 0. 확인 (읽기만 함)
-- 0-a. 현재 컬럼과 NOT NULL 여부
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_name in ('compatibility_submissions', 'compatibility_reports')
order by table_name, ordinal_position;

-- 0-b. 같은 submission 에 리포트 행이 2개 이상인 경우
select submission_id, section_key, count(*) as n,
       count(*) filter (where facts is not null) as with_facts
from compatibility_reports
group by submission_id, section_key
having count(*) > 1;

-- 1. 폼에서 받는 값
alter table compatibility_submissions add column if not exists relationship_type text;
alter table compatibility_submissions add column if not exists concern text;
do $$ begin
  alter table compatibility_submissions
    add constraint compatibility_submissions_relationship_type_chk
    check (relationship_type is null or relationship_type in ('crush','talking','dating','married','ex'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table compatibility_submissions
    add constraint compatibility_submissions_concern_len_chk
    check (concern is null or char_length(concern) <= 200);
exception when duplicate_object then null; end $$;

-- 2. 리포트: 점수판, 생성 상태(잠금), 기록
alter table compatibility_reports add column if not exists score_board jsonb;
alter table compatibility_reports add column if not exists status text;          -- 'generating' | 'done' | 'failed' (예전 행은 null)
alter table compatibility_reports add column if not exists started_at timestamptz;
alter table compatibility_reports add column if not exists finished_at timestamptz;
alter table compatibility_reports add column if not exists error text;
alter table compatibility_reports add column if not exists pipeline text;        -- 'v2' (예전 행은 null)
alter table compatibility_reports add column if not exists meta jsonb;           -- timings, usage, issues, compatFacts

-- 3. 중복 행 정리: facts 가 있는 행이 있으면 facts 없는 중복 행만 지운다.
--    0-b 결과에서 with_facts 가 0 이거나 2 이상인 경우는 지우지 말고 알려 주세요.
delete from compatibility_reports r
using compatibility_reports r2
where r.submission_id = r2.submission_id
  and r.section_key = r2.section_key
  and r.id <> r2.id
  and r.facts is null
  and r2.facts is not null;

-- 4. 같은 submission 에 리포트가 두 번 생기지 않게 (3번 후에도 중복이 남아 있으면 이 줄은 실패합니다 → 알려 주세요)
create unique index if not exists compatibility_reports_submission_section_uq
  on compatibility_reports (submission_id, section_key);
