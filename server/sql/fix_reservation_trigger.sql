-- Fix the prevent_overlap trigger to only check active reservations
-- and use correct overlap detection

DROP TRIGGER IF EXISTS prevent_overlap;

DELIMITER $$

CREATE TRIGGER prevent_overlap 
BEFORE INSERT ON reservation 
FOR EACH ROW 
BEGIN
    DECLARE conflicts INT;
    DECLARE user_total_hours DECIMAL(10,2);
    DECLARE new_duration_hours DECIMAL(10,2);
    
    -- Check for overlapping active reservations in the same room
    -- Two time ranges overlap if: start1 < end2 AND start2 < end1
    SELECT COUNT(*) INTO conflicts 
    FROM reservation
    WHERE room_id = NEW.room_id
      AND status = 'active'
      AND NEW.start_time < end_time
      AND NEW.end_time > start_time;
    
    IF conflicts > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Failed to add reservation: Scheduling conflict';
    END IF;
    
    -- Calculate duration of new reservation in hours
    SET new_duration_hours = TIMESTAMPDIFF(MINUTE, NEW.start_time, NEW.end_time) / 60.0;
    
    -- Check total hours booked by this user on the same day (across all rooms)
    SELECT COALESCE(SUM(TIMESTAMPDIFF(MINUTE, start_time, end_time) / 60.0), 0)
    INTO user_total_hours
    FROM reservation
    WHERE user_id = NEW.user_id
      AND status = 'active'
      AND DATE(start_time) = DATE(NEW.start_time);
    
    -- Check if adding this reservation would exceed 2 hours for the day
    IF (user_total_hours + new_duration_hours) > 2 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Failed to add reservation: Maximum 2 hours per day limit exceeded';
    END IF;
END$$

DELIMITER ;
