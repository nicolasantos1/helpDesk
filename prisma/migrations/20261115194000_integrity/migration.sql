ALTER TABLE "Ticket" ADD CONSTRAINT "ticket_version_positive" CHECK (version >= 0);
ALTER TABLE "Ticket" ADD CONSTRAINT "ticket_assignment_state" CHECK ((status = 'ABERTO' AND "technicianId" IS NULL) OR (status <> 'ABERTO' AND "technicianId" IS NOT NULL));
ALTER TABLE "Ticket" ADD CONSTRAINT "ticket_closed_date" CHECK ((status = 'FECHADO') = ("closedAt" IS NOT NULL));
ALTER TABLE "Ticket" ADD CONSTRAINT "ticket_title_present" CHECK (length(trim(title)) >= 3);
ALTER TABLE "Solution" ADD CONSTRAINT "solution_present" CHECK (length(trim(description)) > 0);
-- Deferred checks validate the final state of the transaction, including nested inserts.
CREATE FUNCTION check_ticket_integrity() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE ticket_id integer; ticket_status "Status";
BEGIN
 IF TG_TABLE_NAME = 'Ticket' THEN ticket_id := NEW.id; ELSE ticket_id := COALESCE(NEW."ticketId", OLD."ticketId"); END IF;
 SELECT status INTO ticket_status FROM "Ticket" WHERE id = ticket_id;
 IF NOT FOUND THEN RETURN NULL; END IF;
 IF NOT EXISTS (SELECT 1 FROM "History" WHERE "ticketId" = ticket_id) THEN RAISE EXCEPTION 'Ticket must contain history'; END IF;
 IF ticket_status IN ('SOLUCIONADO','FECHADO') AND NOT EXISTS (SELECT 1 FROM "Solution" WHERE "ticketId" = ticket_id) THEN RAISE EXCEPTION 'Resolved ticket must contain solution'; END IF;
 RETURN NULL;
END; $$;
CREATE CONSTRAINT TRIGGER ticket_integrity AFTER INSERT OR UPDATE ON "Ticket" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_ticket_integrity();
CREATE CONSTRAINT TRIGGER history_integrity AFTER DELETE ON "History" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_ticket_integrity();
CREATE CONSTRAINT TRIGGER solution_integrity AFTER DELETE ON "Solution" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_ticket_integrity();
