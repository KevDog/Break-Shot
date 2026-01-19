-- Add foul_option event type for opening break foul decisions
-- When a foul occurs on the opening break, the incoming player can choose
-- to accept the table or force the opponent to rerack and break again

ALTER TYPE event_type ADD VALUE 'foul_option';
