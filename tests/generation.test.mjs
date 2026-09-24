import test from 'node:test';
import assert from 'node:assert/strict';
import { createMockCandidate, validateIntent } from '../packages/pal-generation-core/index.mjs';
test('mock generation turns safe prompt into audited degraded-ready runtime asset', () => { const candidate = createMockCandidate({ prompt: '一位复古优雅的成年虚构舞台魔术师' }); assert.equal(candidate.status, 'DEGRADED_READY'); assert.equal(candidate.asset.identity.fictional, true); assert.match(candidate.asset.auditRecordId, /^audit-/); });
test('policy gate blocks celebrity, celebrity-equivalent and age-ambiguous requests', () => { assert.equal(validateIntent('模仿某位明星的成人角色').ok, false); assert.equal(validateIntent('名人同款舞台造型').ok, false); assert.equal(validateIntent('一个未成年学生制服角色').ok, false); });
