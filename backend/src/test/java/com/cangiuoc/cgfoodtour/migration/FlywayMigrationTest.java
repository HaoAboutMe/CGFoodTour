package com.cangiuoc.cgfoodtour.migration;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.sql.Connection;
import java.sql.ResultSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Testcontainers(disabledWithoutDocker = true)
class FlywayMigrationTest {
    @Container
    static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.4")
            .withDatabaseName("cgfoodtour")
            .withUsername("cgfoodtour")
            .withPassword("test-password");

    @Test
    void createsCanonicalSchemaFromEmptyDatabaseAndValidatesChecksums() throws Exception {
        Flyway flyway = Flyway.configure()
                .dataSource(MYSQL.getJdbcUrl(), MYSQL.getUsername(), MYSQL.getPassword())
                .locations("classpath:db/migration")
                .cleanDisabled(true)
                .load();

        var result = flyway.migrate();

        assertEquals(2, result.migrationsExecuted);
        flyway.validate();
        try (Connection connection = MYSQL.createConnection("")) {
            Set<String> requiredTables = Set.of(
                    "user", "stores", "food_items", "store_ratings", "user_saved_stores",
                    "store_daily_reports", "verification_token", "password_reset_otp",
                    "invalidated_token", "media_cleanup_tasks", "store_audit_logs", "flyway_schema_history");
            for (String table : requiredTables) {
                assertTrue(tableExists(connection, table), "Missing migrated table: " + table);
            }
            assertTrue(indexExists(connection, "stores", "idx_stores_status_coordinates"));
            assertTrue(indexExists(connection, "store_ratings", "uq_user_store_rating"));
            assertTrue(indexExists(connection, "media_cleanup_tasks", "idx_media_cleanup_due"));
            assertTrue(indexExists(connection, "store_audit_logs", "idx_store_audit_owner_created"));
            assertTrue(indexExists(connection, "store_audit_logs", "idx_store_audit_store_created"));
            assertTrue(columnExists(connection, "store_audit_logs", "owner_id_snapshot"));
            assertTrue(columnExists(connection, "store_audit_logs", "status_before"));
            assertTrue(columnExists(connection, "store_audit_logs", "status_after"));
            assertTrue(columnExists(connection, "store_audit_logs", "owner_visible"));
        }
    }

    private boolean tableExists(Connection connection, String table) throws Exception {
        try (ResultSet result = connection.getMetaData().getTables(
                connection.getCatalog(), null, table, new String[]{"TABLE"})) {
            return result.next();
        }
    }

    private boolean indexExists(Connection connection, String table, String index) throws Exception {
        try (ResultSet result = connection.getMetaData().getIndexInfo(
                connection.getCatalog(), null, table, false, false)) {
            while (result.next()) {
                if (index.equalsIgnoreCase(result.getString("INDEX_NAME"))) return true;
            }
            return false;
        }
    }

    private boolean columnExists(Connection connection, String table, String column) throws Exception {
        try (ResultSet result = connection.getMetaData().getColumns(
                connection.getCatalog(), null, table, column)) {
            return result.next();
        }
    }
}
