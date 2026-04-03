-- WTF LivePulse — Materialized View for Peak Hours Heatmap
-- Eliminates expensive GROUP BY on checkins at query time

CREATE MATERIALIZED VIEW IF NOT EXISTS gym_hourly_stats AS
    SELECT
        gym_id,
        EXTRACT(DOW FROM checked_in)::INTEGER  AS day_of_week,   -- 0=Sunday, 6=Saturday
        EXTRACT(HOUR FROM checked_in)::INTEGER AS hour_of_day,
        COUNT(*)                               AS checkin_count
    FROM checkins
    WHERE checked_in >= NOW() - INTERVAL '7 days'
    GROUP BY gym_id, day_of_week, hour_of_day;

-- Unique index enables REFRESH CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS idx_gym_hourly_stats_unique
    ON gym_hourly_stats (gym_id, day_of_week, hour_of_day);
