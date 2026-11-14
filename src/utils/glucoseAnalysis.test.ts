import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateClinicalMetrics,
  parseGlucoseInput,
  validatePatientCaseInput,
} from './glucoseAnalysis';

test('calculateClinicalMetrics detects nocturnal hyperglycemia pattern and accurate percentages', () => {
  const metrics = calculateClinicalMetrics([
    { time: '18:00', value: 124 },
    { time: '20:30', value: 158 },
    { time: '23:00', value: 196, context: 'Post-cena' },
    { time: '01:00', value: 234, context: 'Nocturno' },
    { time: '03:00', value: 212, context: 'Nocturno' },
    { time: '07:00', value: 138, context: 'Ayuno' },
  ]);

  assert.equal(metrics.count, 6);
  assert.equal(metrics.minMgDl, 124);
  assert.equal(metrics.maxMgDl, 234);
  assert.equal(metrics.maxTime, '01:00');
  assert.equal(metrics.timeInRangePct, 50);
  assert.equal(metrics.timeAboveRangePct, 50);
  assert.equal(metrics.timeBelowRangePct, 0);
  assert.equal(metrics.detectedPatternLabel, 'Picos hiperglucémicos nocturnos');
});

test('calculateClinicalMetrics flags morning hypoglycemia as critical when below 54 or repeated lows', () => {
  const metrics = calculateClinicalMetrics([
    { time: '22:00', value: 118 },
    { time: '02:00', value: 84 },
    { time: '05:30', value: 52, context: 'Madrugada' },
    { time: '06:30', value: 64, context: 'Despertar' },
    { time: '09:00', value: 112 },
  ]);

  assert.equal(metrics.detectedPatternLabel, 'Descenso hacia hipoglucemia matutina');
  assert.equal(metrics.severity, 'critica');
  assert.equal(metrics.timeBelowRangePct, 40);
});

test('parseGlucoseInput parses CSV/text lines and JSON payloads cleanly', () => {
  const textResult = parseGlucoseInput('08:00, 110, Ayuno\n14:30, 198, Almuerzo\n21:00, 145');
  assert.equal(textResult.error, undefined);
  assert.equal(textResult.readings.length, 3);
  assert.equal(textResult.readings[1].value, 198);
  assert.equal(textResult.readings[0].context, 'Ayuno');

  const jsonResult = parseGlucoseInput(
    JSON.stringify([
      { time: '7:30', value: 102 },
      { time: '13:00', value: 175 },
      { time: '23:30', value: 215 },
    ])
  );
  assert.equal(jsonResult.error, undefined);
  assert.equal(jsonResult.readings[0].time, '07:30');
  assert.equal(jsonResult.readings[2].value, 215);
});

test('parseGlucoseInput rejects malformed lines and out-of-range values', () => {
  const shortResult = parseGlucoseInput('08:00, 110\n12:00, 120');
  assert.ok(shortResult.error);

  const outOfRange = parseGlucoseInput('08:00, 110\n12:00, 890\n18:00, 130');
  assert.ok(outOfRange.error);
});

test('validatePatientCaseInput enforces required fields without silent fallbacks', () => {
  const errors = validatePatientCaseInput({
    patientName: '   ',
    age: 150,
    diabetesType: 'Diabetes tipo 2',
    alertTitle: '',
    readings: [{ time: '08:00', value: 110 }],
  });
  assert.equal(errors.length, 4);
});
