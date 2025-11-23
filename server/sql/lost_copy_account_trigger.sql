-- Suspend the borrower's account when a copy is marked lost while on loan,
-- and reactivate the account automatically once all fines are settled.

DROP TRIGGER IF EXISTS trg_copy_lost_deactivate;
DELIMITER ;;
CREATE TRIGGER trg_copy_lost_deactivate
AFTER UPDATE ON copy
FOR EACH ROW
BEGIN
  DECLARE v_user_id INT DEFAULT NULL;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_user_id = NULL;

  -- Only run when the copy transitions from on_loan to lost
  IF OLD.status = 'on_loan' AND NEW.status = 'lost' THEN
    -- Find the most recent active/lost loan for this copy
    SELECT l.user_id
      INTO v_user_id
      FROM loan l
     WHERE l.copy_id = NEW.copy_id
       AND l.status IN ('active', 'lost')
     ORDER BY l.checkout_date DESC, l.loan_id DESC
     LIMIT 1;

    -- Deactivate the borrower's account (handled at the account level)
    IF v_user_id IS NOT NULL THEN
      UPDATE account
         SET is_active = 0
       WHERE user_id = v_user_id;
    END IF;
  END IF;
END;;
DELIMITER ;

DROP TRIGGER IF EXISTS trg_reactivate_after_fines;
DELIMITER ;;
CREATE TRIGGER trg_reactivate_after_fines
AFTER UPDATE ON fine
FOR EACH ROW
BEGIN
  DECLARE v_open_fines INT DEFAULT 0;

  -- Reactivation check runs when a fine transitions to a resolved state
  IF NEW.status IN ('paid', 'waived', 'written_off') THEN
    SELECT COUNT(*)
      INTO v_open_fines
      FROM fine f
     WHERE f.user_id = NEW.user_id
       AND f.status IN ('open', 'partially_paid');

    -- If no unpaid fines remain, reactivate the account
    IF v_open_fines = 0 THEN
      UPDATE account
         SET is_active = 1
       WHERE user_id = NEW.user_id;
    END IF;
  END IF;
END;;
DELIMITER ;
