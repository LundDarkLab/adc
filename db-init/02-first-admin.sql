-- ============================================================================
-- First administrator account
--
--   email:    admin@example.com
--   password: changeme
--
-- Imported only on the very first start of the database container.
-- LOG IN AND CHANGE THE PASSWORD IMMEDIATELY (Settings -> Manage your data
-- profile), then update name and email, or create your real admin account
-- and disable this one.
-- ============================================================================
INSERT INTO person (id, first_name, last_name, email, institution, position)
VALUES (1, 'Platform', 'Administrator', 'admin@example.com', NULL, NULL);

INSERT INTO user (password_hash, is_active, role, person)
VALUES ('$2y$10$odsWU82RSOOUXRu/lakKbO8.utNBdjcr7mNBs2NFMkavqXdRKZ2nW', 1, 1, 1);
