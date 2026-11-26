
const pool = require('../config/db');
const isValidMetric = value =>
  value !== null &&
  value !== undefined &&
  Number.isFinite(Number(value));

const INCIDENT_RULES = [
  {
    code: 'HIGH_TEMPERATURE_WARNING',
    description: 'Nhiệt độ nhà kính vượt ngưỡng an toàn (>25°C).',
    priority: 'HIGH',
    condition: metrics => {
      if (!isValidMetric(metrics.temperature)) return null;
      return metrics.temperature > 25 && metrics.temperature <= 30;
    }
  },
  {
    code: 'HIGH_TEMPERATURE_CRITICAL',
    description: 'Nhiệt độ nhà kính ở mức nguy hiểm (>30°C).',
    priority: 'CRITICAL',
    condition: metrics => {
      if (!isValidMetric(metrics.temperature)) return null;
      return metrics.temperature > 30;
    }
  },
  {
    code: 'HIGH_AIR_HUMIDITY',
    description: 'Độ ẩm không khí vượt ngưỡng 80%.',
    priority: 'HIGH',
    condition: metrics => {
      if (!isValidMetric(metrics.airHumidity)) return null;
      return metrics.airHumidity > 80;
    }
  },
  {
    code: 'LOW_AIR_HUMIDITY',
    description: 'Độ ẩm không khí thấp hơn 50%.',
    priority: 'HIGH',
    condition: metrics => {
      if (!isValidMetric(metrics.airHumidity)) return null;
      return metrics.airHumidity < 50;
    }
  },
  {
    code: 'LOW_WATER_TANK',
    description: 'Mực nước bồn chứa ở mức nguy hiểm (<=15%).',
    priority: 'CRITICAL',
    condition: metrics => {
      if (!isValidMetric(metrics.waterTankLevel)) return null;
      return metrics.waterTankLevel <= 15;
    }
  }
];

const getZoneDatabaseId = async (zoneId, client = pool) => {
  const result = await client.query(
    'SELECT id FROM zones WHERE zone_code = $1',
    [zoneId]
  );

  if (result.rows.length === 0) {
    throw new Error(`Không tìm thấy khu vực ${zoneId}.`);
  }

  return result.rows[0].id;
};


const syncZoneIncidents = async (zoneId, metrics) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const databaseZoneId = await getZoneDatabaseId(zoneId, client);

    await client.query(
      'SELECT id FROM zones WHERE id = $1 FOR UPDATE',
      [databaseZoneId]
    );

    const activeResult = await client.query(
      `
        SELECT id, description
        FROM incidents
        WHERE zone_id = $1
          AND status IN ('OPEN', 'IN_PROGRESS')
        FOR UPDATE
      `,
      [databaseZoneId]
    );

    const activeIncidents = activeResult.rows;
    const activeDescriptions = new Set(
      activeIncidents.map(incident => incident.description)
    );

    const ruleResults = INCIDENT_RULES.map(rule => ({
      ...rule,
      result: rule.condition(metrics)
    }));

    const activeRules = ruleResults.filter(
      rule => rule.result === true
    );

    const createdIncidents = [];
    const resolvedIncidents = [];

    for (const rule of activeRules) {
      if (activeDescriptions.has(rule.description)) {
        continue;
      }

      const result = await client.query(
        `
          INSERT INTO incidents (
            zone_id,
            description,
            priority,
            status
          )
          VALUES ($1, $2, $3, 'OPEN')
          RETURNING *
        `,
        [
          databaseZoneId,
          rule.description,
          rule.priority
        ]
      );

      createdIncidents.push(result.rows[0]);
    }

    for (const incident of activeIncidents) {
      const rule = ruleResults.find(
        item => item.description === incident.description
      );

      if (!rule || rule.result !== false) {
        continue;
      }

      const result = await client.query(
        `
          UPDATE incidents
          SET status = 'RESOLVED'
          WHERE id = $1
          RETURNING *
        `,
        [incident.id]
      );

      resolvedIncidents.push(result.rows[0]);
    }

    await client.query('COMMIT');

    return {
      zoneId,
      createdIncidents,
      resolvedIncidents
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};


module.exports = {
  INCIDENT_RULES,
  syncZoneIncidents
};
