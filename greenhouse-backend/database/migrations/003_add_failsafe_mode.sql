
BEGIN;

ALTER TABLE actuator_commands
DROP CONSTRAINT IF EXISTS actuator_commands_mode_check;

ALTER TABLE actuator_commands
ADD CONSTRAINT actuator_commands_mode_check
CHECK (
    mode IN (
        'AUTO',
        'MANUAL_OVERRIDE',
        'FAILSAFE'
    )
);

COMMIT;
