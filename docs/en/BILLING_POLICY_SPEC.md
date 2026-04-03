# Sovereign Coder Billing Policy Specification

Status: Draft v1.0  
Date: 2026-04-04  
Strategy objective: Max adoption in first 12 months

## 1. Scope

This specification defines pricing, billing, quota enforcement, and anti-abuse policy for Sovereign Coder subscriptions.

## 2. Pricing Model

### 2.1 Free Tiers

1. Individual Free: $0 forever.
2. Organization Starter Free: $0 for organizations with 1-5 active users.
3. Organization Growth Free: $0 for organizations with 6+ active users, subject to usage and feature limits.

### 2.2 Paid Tiers

1. Pro: 6-50 users at $5/user/month.
2. Business: 51-200 users at $7/user/month.
3. Enterprise: 201+ users at $9/user/month or custom annual contract.

### 2.3 Annual Discount

Annual paid contracts receive a 10% discount from monthly list price.

## 3. Seat And Billing Definitions

1. Active seat: A user with login access during the billing period.
2. Billable seat count: Number of active seats in paid plans.
3. Proration: Daily proration for seat additions/removals during an active cycle.
4. Minimum paid entry: 6 seats (by design of paid tiers).

## 4. Free Growth Limits (Option C)

Applies to organizations with 6+ users that remain on free growth.

1. API and automation usage caps enforced monthly.
2. Concurrent heavy job limits.
3. Basic analytics only (no advanced analytics/export).
4. No SSO/SAML, SCIM, or compliance export features.
5. Community support only.

### 4.1 Usage Warning Cadence

1. Warning at 70% of quota.
2. Warning at 85% of quota.
3. Warning at 100% of quota with upgrade CTA.
4. Hard cap enforcement after 100% with optional grace actions.

### 4.2 One-Time Grace

On first hard-cap event per org, offer a one-time 14-day temporary quota boost.

## 5. Upgrade And Downgrade Policy

### 5.1 Upgrade Triggers

The product should surface paid-plan recommendation when any of the following occur:

1. Quota cap reached 2 or more months in rolling 3-month window.
2. Team requests feature unavailable in free growth tier (for example SSO/SCIM).
3. Team requests higher support SLA.

### 5.2 Upgrade Execution

1. Upgrade is customer-initiated.
2. Seat billing starts immediately at selected paid tier.
3. Charges are prorated for remaining cycle.

### 5.3 Downgrade

1. Customer may downgrade at renewal boundary.
2. If downgrading to free tier, paid-only features become read-only where applicable.
3. Data retention for paid-only artifacts: 90 days unless regulatory requirement states otherwise.

## 6. Anti-Abuse Policy

1. Default limit: one free-growth organization per verified domain.
2. Abuse heuristics: ownership overlap, payment instrument overlap, suspicious account graph patterns.
3. Enforcement ladder:
   - Soft warning
   - Quota normalization
   - Manual review lock
4. Legitimate multi-org enterprises may be allowlisted by support/admin review.

## 7. Entitlements Matrix (Canonical)

| Capability | Individual Free | Org Starter Free (<=5) | Org Growth Free (6+) | Pro | Business | Enterprise |
|---|---:|---:|---:|---:|---:|---:|
| Core product access | Yes | Yes | Yes | Yes | Yes | Yes |
| Shared organization workspace | No | Yes | Yes | Yes | Yes | Yes |
| API/automation quotas | Low | Medium | Limited | High | Higher | Custom |
| Advanced analytics/export | No | No | No | Partial | Yes | Yes |
| SSO/SAML | No | No | No | No | Optional | Yes |
| SCIM | No | No | No | No | No | Yes |
| Compliance export controls | No | No | No | No | Partial | Yes |
| Support SLA | Community | Community | Community | Priority | Faster | Enterprise |

## 8. KPI Instrumentation

Track monthly and cohort metrics:

1. New organizations created.
2. Activation rate (first successful team workflow).
3. Retention (M1, M3, M6) for free and paid cohorts.
4. Free-growth to paid conversion rate.
5. Net new seats per active organization.
6. Paid churn and gross revenue retention.

## 9. Legal And Communication Requirements

1. Pricing page must clearly describe free-growth limits.
2. Billing terms must disclose proration and annual discount.
3. Product must show in-app notices before quota hard-cap.
4. Terms changes require 30-day notice for paid customers.

## 10. Rollout Plan (Year 1)

1. Phase 1 (Month 0-2): Launch all tiers and free-growth limits.
2. Phase 2 (Month 3-6): Tune quotas and warning thresholds based on conversion and retention.
3. Phase 3 (Month 7-12): Enterprise packaging and procurement optimization.

## 11. Open Decisions For Finance/Legal

1. Tax/VAT handling by country and invoice formatting.
2. Exact data retention policy for downgraded paid artifacts.
3. Refund policy for seat reductions and annual plans.
4. Contract language for custom enterprise discounting.
