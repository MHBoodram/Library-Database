-- Recreate loan_limit trigger to enforce faculty-aware limits
DROP TRIGGER IF EXISTS loan_limit;
DELIMITER ;;
CREATE TRIGGER loan_limit
BEFORE INSERT ON loan
FOR EACH ROW
begin
    declare loan_lim int default 5;
    declare loan_count int default 0;
    declare faculty tinyint(1) default 0;

    select coalesce(is_faculty,0) into faculty
      from user
     where user_id = NEW.user_id
     limit 1;

    if faculty = 1 then
        set loan_lim = 7;
    end if;

    select count(*) into loan_count
      from loan
     where user_id = NEW.user_id
       and status = 'active';

    if loan_count >= loan_lim then
        signal SQLSTATE '45000'
        set MESSAGE_TEXT = 'Failed to add new loan: User loan limit exceeded';
    end if;
end;;
DELIMITER ;
