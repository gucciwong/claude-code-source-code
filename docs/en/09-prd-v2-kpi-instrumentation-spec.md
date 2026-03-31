# Sovereign Coder KPI Instrumentation Spec

> Status: Draft
> PRD Baseline: Sovereign Coder PRD v1.0
> Date: 2026-03-31
> Owners: Product, Data, Engineering

## 1. Purpose

Define instrumentation and reporting requirements for Sovereign Coder success metrics across product adoption, technical quality, and business growth.

## 2. Metric Taxonomy

## 2.1 Product Metrics

1. DAU (Daily Active Users).
2. MAU (Monthly Active Users).
3. Code acceptance rate.
4. HumanEval pass@1.
5. SWE-bench resolution rate.
6. Model fine-tune cycle time.

## 2.2 Technical Metrics

1. First-token latency.
2. Token throughput.
3. VRAM utilization.
4. Offline capability success rate.
5. Training cost per fine-tune cycle.
6. Model quality drift rate.

## 2.3 Business Metrics

1. ARR.
2. Enterprise customer count.
3. Federated network count.
4. Net Promoter Score.

## 3. Event Schema

## 3.1 Common Event Fields

1. event_name
2. event_version
3. timestamp_utc
4. session_id
5. installation_id_hash
6. project_id_hash
7. client_version
8. platform
9. runtime_backend
10. model_id
11. correlation_id

## 3.2 Domain Event Groups

### Inference Events

1. inference_request_started
2. inference_first_token_emitted
3. inference_request_completed
4. inference_request_failed

Required fields:
1. prompt_tokens
2. completion_tokens
3. first_token_latency_ms
4. tokens_per_second
5. backend_name
6. model_quantization

### Completion Events

1. completion_suggested
2. completion_accepted
3. completion_rejected
4. completion_edited_after_accept

Required fields:
1. completion_type
2. language
3. suggestion_length_tokens
4. accepted_boolean
5. edit_distance_after_accept

### Training Events

1. training_job_started
2. training_job_checkpoint
3. training_job_completed
4. training_job_failed

Required fields:
1. training_method
2. lora_rank
3. dataset_size_samples
4. epoch_count
5. validation_loss
6. job_duration_minutes

### Federation Events

1. federation_joined
2. federation_round_started
3. federation_update_submitted
4. federation_round_aggregated

Required fields:
1. federation_id
2. round_id
3. privacy_mode
4. update_weight
5. aggregation_success

## 4. Data Quality Rules

1. All events must include event_version and correlation_id.
2. Null rate for critical fields must stay below 0.5%.
3. Schema mismatch rate must stay below 0.2%.
4. Late event arrival threshold is 10 minutes.

## 5. Reporting Cadence

1. Daily dashboard refresh for product and technical health.
2. Weekly delivery review against roadmap milestones.
3. Biweekly model quality review.
4. Monthly executive report for business metrics.

## 6. Alert Thresholds

1. First-token latency exceeds 500ms (7B) or 1000ms (32B) for 3 consecutive days.
2. Token throughput drops below 30 tokens per second for 24 hours.
3. Code acceptance rate drops by more than 10% week over week.
4. HumanEval pass@1 drops below baseline by more than 5 points.
5. Training cost per cycle exceeds target by more than 20%.

## 7. Instrumentation Readiness Checklist

1. Event schema reviewed by data owner.
2. Field definitions include sampling and privacy guidance.
3. Baseline benchmarks captured and versioned.
4. Dashboards mapped to product, technical, and business owners.
5. Alert response playbook is documented.

## 8. Open Decisions

1. Default aggregation windows for DAU and acceptance trends.
2. Segment thresholds by hardware tier.
3. Federation metrics retention period and anonymization policy.
