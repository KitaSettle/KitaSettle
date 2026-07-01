-- Seed global skills and new-user onboarding

insert into public.skills (user_id, name, description, input_description, output_description, enabled, search_tags)
values
  (null, 'Summarise regulatory updates', 'Condense CAAM, FAA, and EASA changes into executive-ready briefs.', 'Regulation document or knowledge item IDs', 'Structured summary with key changes', true, array['CAAM', 'ICAO', 'CBTA']),
  (null, 'Compare authority requirements', 'Cross-reference CAAM vs EASA training and compliance differences.', 'Document IDs or text payloads', 'Comparison matrix with highlighted differences', true, array['CAAM', 'CBTA']),
  (null, 'Draft executive briefs', 'Prepare daily focus summaries from your knowledge and priorities.', 'Knowledge, memory, research context', 'Executive brief with priorities and focus', true, array['Leadership']),
  (null, 'Analyse proposal risks', 'Surface scope, pricing, and delivery risks before client submission.', 'Project scope and related knowledge', 'Ranked risk list with mitigation notes', false, array['Proposal', 'Steelworks', 'Finance']),
  (null, 'Track industry signals', 'Monitor IATA, Boeing, and McKinsey for relevant market shifts.', 'Trusted source IDs and monitoring window', 'Change log with recommended actions', false, array['RVSM']);

create or replace function public.seed_default_user_data(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.executive_briefs (
    user_id, summary, confidence_score, recommended_focus,
    priorities, decisions, risks, opportunities, ai_prepared, workload_estimate, is_active
  ) values (
    p_user_id,
    'Today centres on two high-impact deliverables: the steelworks proposal and tomorrow''s aviation training session. Both need your review before end of day. Everything else can wait.',
    87,
    'Finalise the steelworks proposal and prepare tomorrow''s aviation training session.',
    '[{"id":"p1","title":"Review steelworks proposal","description":"Draft is prepared — confirm scope, pricing, and project photos."},{"id":"p2","title":"Prepare CBTA lesson","description":"Training slides need stronger scenario discussion for tomorrow."},{"id":"p3","title":"Capture one business idea for review","description":"Quick note on the aviation module concept — 15 minutes."}]'::jsonb,
    '[{"id":"d1","title":"Approve proposal direction","status":"needs-approval"},{"id":"d2","title":"Confirm pricing assumptions","status":"needs-approval"}]'::jsonb,
    '[{"id":"r1","title":"Proposal lacks project photos"},{"id":"r2","title":"Training slides need stronger scenario discussion"}]'::jsonb,
    '[{"id":"o1","title":"Turn aviation lesson framework into reusable product module"}]'::jsonb,
    '[{"id":"a1","title":"Steelworks proposal draft","description":"Scope, pricing table, and executive summary prepared for your review."},{"id":"a2","title":"CBTA lesson outline","description":"Session structure and learning objectives mapped — slides need your input."},{"id":"a3","title":"Weekly priority scan","description":"Cross-checked calendar and open items to surface today''s focus areas."}]'::jsonb,
    '4.5 hours',
    true
  );

  insert into public.knowledge (user_id, title, summary, content, source, url, category, subcategory, confidence, published_date, tags, importance)
  values
    (p_user_id, 'ICAO RVSM monitoring requirements — Asia-Pacific ops update', 'Revised RVSM monitoring group guidance adjusts height-keeping performance thresholds for Asia-Pacific routes.', 'The ICAO Asia-Pacific RVSM monitoring group has published updated height-keeping performance thresholds effective Q3.', 'ICAO', 'https://www.icao.int/safety/airnavigation/Pages/default.aspx', 'Aviation Regulations', 'RVSM', 93, '2026-06-28T08:00:00+00', array['RVSM','ICAO','CBTA'], 'High'),
    (p_user_id, 'FAA CBTA advisory circular — evidence and instructor standards', 'Updated circular clarifies competency evidence capture and assessor qualifications for CBTA programmes.', 'FAA AC updates define minimum evidence standards for CBTA programmes and instructor assessor qualifications.', 'FAA', 'https://www.faa.gov/regulations_policies/advisory_circulars/', 'Training & CBTA', 'Competency Assessment', 91, '2026-06-27T10:30:00+00', array['CBTA','FAA'], 'High'),
    (p_user_id, 'CAAM recurrent training compliance and logging windows', 'New CAAM guidance tightens recurrent check documentation and simulator session record retention.', 'CAAM circular updates specify recurrent training compliance windows and audit documentation requirements.', 'CAAM', 'https://www.caam.gov.my/', 'Aviation Regulations', 'Recurrent Training', 86, '2026-06-26T07:15:00+00', array['CAAM','CBTA'], 'Medium'),
    (p_user_id, 'Steelworks proposal — CIDB compliance and scope validation', 'Prepared review confirms structural scope, phased delivery milestones, and CIDB registration alignment.', 'Proposal review validates structural scope, phased delivery milestones, and CIDB registration alignment.', 'CIDB', 'https://www.cidb.gov.my/', 'Construction & Projects', 'Proposals', 88, '2026-06-25T12:00:00+00', array['Proposal','Steelworks'], 'High'),
    (p_user_id, 'Executive decision quality under operational pressure', 'Leadership brief outlines decision frameworks for founders balancing multiple high-stakes deliverables.', 'Framework for prioritising aviation training, client proposals, and strategic initiatives without cognitive overload.', 'Harvard Business Review', 'https://hbr.org/', 'Leadership & Decisions', 'Decision Making', 79, '2026-06-24T09:00:00+00', array['Leadership'], 'Medium'),
    (p_user_id, 'Steelworks Phase 2 pricing sensitivity analysis', 'Margin sensitivity on steelworks Phase 2 requires confirmation before final client submission.', 'Financial review highlights margin sensitivity on Phase 2 scope.', 'Internal', 'https://kitasettle.local/knowledge', 'Finance', 'Pricing', 82, '2026-06-24T08:00:00+00', array['Finance','Proposal','Steelworks'], 'High');

  insert into public.executive_memory (user_id, title, description, category, importance, search_tags, status)
  values
    (p_user_id, 'Steelworks proposal scope confirmed', 'Approved direction: focus on structural scope, phased delivery, and photo documentation for client review.', 'Decisions', 'High', array['Steelworks','Proposal'], 'active'),
    (p_user_id, 'CBTA lesson improvement note', 'Add stronger scenario discussion and evidence capture for competency assessment in tomorrow''s session.', 'Training', 'High', array['CBTA'], 'active'),
    (p_user_id, 'Aviation module concept captured', 'Modular CBTA package for regional operators — partner with training centre, recurring revenue model.', 'Ideas', 'Medium', array['CBTA','ICAO'], 'active'),
    (p_user_id, 'Pricing assumptions flagged for review', 'Margin sensitivity on steelworks Phase 2 — confirm before sending final proposal.', 'Finance', 'High', array['Finance','Proposal','Steelworks'], 'pending');

  insert into public.research_queue (user_id, title, summary, source, source_url, confidence, importance, why_it_matters, status, tags, queued_at)
  values
    (p_user_id, 'ICAO RVSM monitoring requirements — Asia-Pacific ops update', 'Revised RVSM monitoring group guidance adjusts height-keeping performance thresholds for Asia-Pacific routes through Q3.', 'ICAO', 'https://www.icao.int/safety/airnavigation/Pages/default.aspx', 93, 'High', 'Affects recurrent training scenarios and briefing content for regional operator clients this month.', 'Ready', array['RVSM','ICAO'], '2026-07-01T06:00:00+00'),
    (p_user_id, 'FAA CBTA advisory circular — evidence and instructor standards', 'Updated circular clarifies competency evidence capture, assessor qualifications, and CBTA programme documentation.', 'FAA', 'https://www.faa.gov/regulations_policies/advisory_circulars/', 91, 'High', 'Directly shapes tomorrow''s CBTA lesson structure and your training centre audit readiness.', 'Ready', array['CBTA'], '2026-07-01T05:30:00+00'),
    (p_user_id, 'CAAM circular — recurrent training compliance and logging windows', 'New CAAM guidance tightens recurrent check documentation and simulator session record retention periods.', 'CAAM', 'https://www.caam.gov.my/', 86, 'Medium', 'Keeps your Malaysia-based training operations aligned before the next CAAM regulatory review.', 'Analysing', array['CAAM','CBTA'], '2026-06-30T18:00:00+00'),
    (p_user_id, 'Steelworks proposal — CIDB compliance and scope validation', 'Prepared review confirms structural scope, phased delivery milestones, and CIDB registration alignment for the proposal.', 'CIDB', 'https://www.cidb.gov.my/', 88, 'High', 'Client submission is due end of day — pricing and photo documentation still need your final approval.', 'Ready', array['Proposal','Steelworks'], '2026-06-30T12:00:00+00'),
    (p_user_id, 'HBR — executive decision quality under operational pressure', 'Leadership brief outlines decision frameworks for founders balancing multiple high-stakes deliverables weekly.', 'Harvard Business Review', 'https://hbr.org/', 79, 'Medium', 'Supports how you prioritise aviation training, proposals, and strategic ideas without cognitive overload.', 'Searching', array['Leadership'], '2026-06-30T10:00:00+00');

  insert into public.brain_activity (user_id, action, target, created_at)
  values
    (p_user_id, 'Saved to memory', 'CBTA lesson improvement note', now() - interval '2 hours'),
    (p_user_id, 'Approved research', 'EASA winter ops briefing', now() - interval '1 day'),
    (p_user_id, 'Added trusted source', 'Harvard Business Review', now() - interval '1 day 5 hours'),
    (p_user_id, 'Rejected research', 'Generic HR compliance roundup', now() - interval '5 days');
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.email, '')
  );

  perform public.seed_default_user_data(new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);
