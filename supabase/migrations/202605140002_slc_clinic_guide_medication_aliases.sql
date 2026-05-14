-- Clinic Guide medication alias seed.
-- Known IVF medication names should normalize without calling an LLM.

insert into medications (id, brand_name_ko, brand_name_en, aliases, category, route, default_unit, default_cta, patient_label, time_criticality, is_slc_seed) values
  ('gonal-f', '고날에프', 'Gonal-F', '{}', 'stimulation', 'subcutaneous_injection', 'IU', '주사하기', 'Gonal-F', 'normal', true),
  ('menopur', '메노푸어', 'Menopur', '{}', 'stimulation', 'subcutaneous_injection', 'IU', '주사하기', 'Menopur', 'normal', true),
  ('cetrotide', '세트로타이드', 'Cetrotide', '{}', 'suppression', 'subcutaneous_injection', 'mg', '주사하기', 'Cetrotide', 'high', true),
  ('ovitrelle', '오비드렐', 'Ovitrelle', '{}', 'trigger', 'subcutaneous_injection', 'syringe', '주사하기', 'Ovitrelle (트리거)', 'critical', true),
  ('decapeptyl', '데카펩틸', 'Decapeptyl', '{}', 'trigger', 'subcutaneous_injection', 'syringe', '주사하기', 'Decapeptyl (트리거)', 'critical', true),
  ('cyclogest', '사이클로게스트', 'Cyclogest', '{}', 'luteal_support', 'vaginal', '개', '사용하기', 'Cyclogest', 'normal', true),
  ('utrogestan', '우트로게스탄', 'Utrogestan', '{}', 'luteal_support', 'vaginal', '정', '사용하기', 'Utrogestan', 'normal', true),
  ('pergoveris', '퍼고베리스', 'Pergoveris', '{}', 'stimulation', 'subcutaneous_injection', 'IU', '주사하기', 'Pergoveris', 'normal', true),
  ('elonva', '엘론바', 'Elonva', '{}', 'stimulation', 'subcutaneous_injection', 'μg', '주사하기', 'Elonva', 'normal', true),
  ('bemfola', '벰폴라', 'Bemfola', '{}', 'stimulation', 'subcutaneous_injection', 'IU', '주사하기', 'Bemfola', 'normal', true)
on conflict (id) do update set
  brand_name_ko = excluded.brand_name_ko,
  brand_name_en = excluded.brand_name_en,
  category = excluded.category,
  route = excluded.route,
  default_unit = excluded.default_unit,
  default_cta = excluded.default_cta,
  patient_label = excluded.patient_label,
  time_criticality = excluded.time_criticality,
  is_slc_seed = true;

update medications set aliases = array['Gonal-F','고날에프','고날-에프','폴리트로핀 알파','FSH'] where brand_name_en = 'Gonal-F';
update medications set aliases = array['Menopur','메노푸어','메노퓨어','메노트로핀'] where brand_name_en = 'Menopur';
update medications set aliases = array['Cetrotide','세트로타이드','세트로렐릭스'] where brand_name_en = 'Cetrotide';
update medications set aliases = array['Ovitrelle','Ovidrel','오비드렐','코리오고나도트로핀'] where brand_name_en = 'Ovitrelle';
update medications set aliases = array['Decapeptyl','데카펩틸','트립토렐린'] where brand_name_en = 'Decapeptyl';
update medications set aliases = array['Cyclogest','사이클로게스트','황체호르몬 질정'] where brand_name_en = 'Cyclogest';
update medications set aliases = array['Utrogestan','우트로게스탄','미분화 프로게스테론'] where brand_name_en = 'Utrogestan';
update medications set aliases = array['Pergoveris','퍼고베리스'] where brand_name_en = 'Pergoveris';
update medications set aliases = array['Elonva','엘론바','코리폴리트로핀 알파'] where brand_name_en = 'Elonva';
update medications set aliases = array['Bemfola','벰폴라'] where brand_name_en = 'Bemfola';
