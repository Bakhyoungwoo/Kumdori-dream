-- 개발/초기 검증용 공식 프레임 데이터
-- 실제 이미지 파일은 AWS_S3_BUCKET에 아래 object key로 업로드한다.

INSERT INTO characters (id, name, profile_image_key)
VALUES
    ('00000000-0000-0000-0000-000000000101', 'Stella', 'characters/stella/profile.png'),
    ('00000000-0000-0000-0000-000000000102', 'Nova', 'characters/nova/profile.png'),
    ('00000000-0000-0000-0000-000000000103', 'Lumi', 'characters/lumi/profile.png')
ON CONFLICT (id) DO NOTHING;

INSERT INTO frames (id, character_id, source_type, title, description, template_key, slot_count)
VALUES
    ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000101', 'CHARACTER', 'Stella First Meeting', '공식 스텔라 네컷 프레임', 'frames/stella/first-meeting/template.png', 4),
    ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000101', 'CHARACTER', 'Stella Behind Selfie', '스텔라 무대 뒤 셀카 프레임', 'frames/stella/behind-selfie/template.png', 2),
    ('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000102', 'CHARACTER', 'Nova Summer Sea', '노바 여름 바다 프레임', 'frames/nova/summer-sea/template.png', 4),
    ('00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000103', 'CHARACTER', 'Lumi Support Shot', '루미 응원봉 인증 프레임', 'frames/lumi/support-shot/template.png', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO frame_slots (id, frame_id, slot_index, target_image_key, analysis)
VALUES
    ('00000000-0000-0000-0000-000000001001', '00000000-0000-0000-0000-000000000201', 0, 'frames/stella/first-meeting/slot-0.png', '{"aspectRatio": "3:4"}'),
    ('00000000-0000-0000-0000-000000001002', '00000000-0000-0000-0000-000000000201', 1, 'frames/stella/first-meeting/slot-1.png', '{"aspectRatio": "3:4"}'),
    ('00000000-0000-0000-0000-000000001003', '00000000-0000-0000-0000-000000000201', 2, 'frames/stella/first-meeting/slot-2.png', '{"aspectRatio": "3:4"}'),
    ('00000000-0000-0000-0000-000000001004', '00000000-0000-0000-0000-000000000201', 3, 'frames/stella/first-meeting/slot-3.png', '{"aspectRatio": "3:4"}'),
    ('00000000-0000-0000-0000-000000001005', '00000000-0000-0000-0000-000000000202', 0, 'frames/stella/behind-selfie/slot-0.png', '{"aspectRatio": "1:1"}'),
    ('00000000-0000-0000-0000-000000001006', '00000000-0000-0000-0000-000000000202', 1, 'frames/stella/behind-selfie/slot-1.png', '{"aspectRatio": "1:1"}'),
    ('00000000-0000-0000-0000-000000001007', '00000000-0000-0000-0000-000000000203', 0, 'frames/nova/summer-sea/slot-0.png', '{"aspectRatio": "3:4"}'),
    ('00000000-0000-0000-0000-000000001008', '00000000-0000-0000-0000-000000000203', 1, 'frames/nova/summer-sea/slot-1.png', '{"aspectRatio": "3:4"}'),
    ('00000000-0000-0000-0000-000000001009', '00000000-0000-0000-0000-000000000203', 2, 'frames/nova/summer-sea/slot-2.png', '{"aspectRatio": "3:4"}'),
    ('00000000-0000-0000-0000-000000001010', '00000000-0000-0000-0000-000000000203', 3, 'frames/nova/summer-sea/slot-3.png', '{"aspectRatio": "3:4"}'),
    ('00000000-0000-0000-0000-000000001011', '00000000-0000-0000-0000-000000000204', 0, 'frames/lumi/support-shot/slot-0.png', '{"aspectRatio": "1:1"}')
ON CONFLICT (id) DO NOTHING;
