#!/bin/bash

# Comprehensive Multi-Client Implementation Test
# Tests all user roles with the newly created test users

BASE_URL="http://localhost:5002/api"

echo "======================================================================="
echo "🧪 MULTI-CLIENT IMPLEMENTATION - COMPREHENSIVE TEST"
echo "======================================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Test users
declare -A TEST_USERS=(
    ["admin"]="test.admin@visionwest.org.nz"
    ["client_admin"]="test.clientadmin@visionwest.org.nz"
    ["staff"]="test.staff@visionwest.org.nz"
    ["client"]="test.client@visionwest.org.nz"
)

TEST_PASSWORD="Test@123"

# Track test results
TESTS_PASSED=0
TESTS_FAILED=0

run_test() {
    local test_name=$1
    local result=$2

    if [ "$result" = "pass" ]; then
        print_success "$test_name"
        ((TESTS_PASSED++))
    else
        print_error "$test_name"
        ((TESTS_FAILED++))
    fi
}

echo "═══════════════════════════════════════════════════════════════════════"
echo "TEST SUITE 1: Authentication & Client Context"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""

for role in "${!TEST_USERS[@]}"; do
    email="${TEST_USERS[$role]}"

    echo "───────────────────────────────────────────────────────────────────────"
    echo "Testing Role: ${role}"
    echo "Email: ${email}"
    echo "───────────────────────────────────────────────────────────────────────"

    # Test 1: Login
    print_info "Test 1.${role}: Login"
    LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"$TEST_PASSWORD\"}")

    SUCCESS=$(echo "$LOGIN_RESPONSE" | jq -r '.success')

    if [ "$SUCCESS" = "true" ]; then
        TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
        USER_ROLE=$(echo "$LOGIN_RESPONSE" | jq -r '.user.role')
        CLIENT_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.user.client_id')
        CLIENT_NAME=$(echo "$LOGIN_RESPONSE" | jq -r '.user.client.name')

        print_success "Login successful"
        print_info "  Role: $USER_ROLE | Client ID: $CLIENT_ID | Client: $CLIENT_NAME"
        run_test "Auth: $role login" "pass"

        # Test 2: JWT contains clientId
        JWT_PAYLOAD=$(echo "$TOKEN" | cut -d'.' -f2 | base64 -d 2>/dev/null)
        JWT_CLIENT_ID=$(echo "$JWT_PAYLOAD" | jq -r '.clientId')
        JWT_CLIENT_CODE=$(echo "$JWT_PAYLOAD" | jq -r '.clientCode')

        if [ "$JWT_CLIENT_ID" != "null" ] && [ "$JWT_CLIENT_CODE" != "null" ]; then
            print_success "JWT contains clientId: $JWT_CLIENT_ID, clientCode: $JWT_CLIENT_CODE"
            run_test "JWT: $role has client context" "pass"
        else
            print_error "JWT missing client information"
            run_test "JWT: $role has client context" "fail"
        fi

        # Test 3: Fetch work orders
        print_info "Test 3.${role}: Fetch work orders"
        WO_RESPONSE=$(curl -s -X GET "$BASE_URL/work-orders?limit=5" \
            -H "Authorization: Bearer $TOKEN")

        WO_SUCCESS=$(echo "$WO_RESPONSE" | jq -r '.success')
        if [ "$WO_SUCCESS" = "true" ]; then
            WO_COUNT=$(echo "$WO_RESPONSE" | jq '.pagination.total')
            print_success "Fetched $WO_COUNT work orders"
            run_test "Data: $role can fetch work orders" "pass"
        else
            print_error "Failed to fetch work orders"
            run_test "Data: $role can fetch work orders" "fail"
        fi

        # Test 4: Dashboard summary
        print_info "Test 4.${role}: Dashboard summary"
        SUMMARY_RESPONSE=$(curl -s -X GET "$BASE_URL/work-orders/summary" \
            -H "Authorization: Bearer $TOKEN")

        SUMMARY_SUCCESS=$(echo "$SUMMARY_RESPONSE" | jq -r '.success')
        if [ "$SUMMARY_SUCCESS" = "true" ]; then
            TOTAL=$(echo "$SUMMARY_RESPONSE" | jq '.data.total')
            PENDING=$(echo "$SUMMARY_RESPONSE" | jq '.data.pending')
            print_success "Dashboard: Total=$TOTAL, Pending=$PENDING"
            run_test "Summary: $role dashboard" "pass"
        else
            print_error "Failed to get dashboard summary"
            run_test "Summary: $role dashboard" "fail"
        fi

        # Test 5: Create work order (only for client_admin)
        if [ "$role" = "client_admin" ]; then
            print_info "Test 5.${role}: Create work order"
            TEST_JOB_NO="TEST-${role}-$(date +%s)"

            CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/work-orders" \
                -H "Authorization: Bearer $TOKEN" \
                -H "Content-Type: application/json" \
                -d "{
                    \"job_no\": \"$TEST_JOB_NO\",
                    \"date\": \"$(date +%Y-%m-%d)\",
                    \"supplier_name\": \"Test Supplier for $role\",
                    \"supplier_phone\": \"555-TEST\",
                    \"supplier_email\": \"supplier@test.com\",
                    \"property_name\": \"Test Property $role\",
                    \"property_address\": \"123 Test St\",
                    \"description\": \"Test work order created by $role role\",
                    \"authorized_by\": \"Test Manager\",
                    \"authorized_email\": \"$email\"
                }")

            CREATE_SUCCESS=$(echo "$CREATE_RESPONSE" | jq -r '.success')
            if [ "$CREATE_SUCCESS" = "true" ]; then
                NEW_WO_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.id')
                print_success "Created work order ID: $NEW_WO_ID"
                run_test "Create: $role can create work order" "pass"

                # Verify it has client_id in database
                echo ""
                print_info "Verifying client_id in database..."
                DB_CHECK=$(node -e "
                    const { Sequelize } = require('sequelize');
                    const dbConfig = require('./config/db.config');
                    const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
                        host: dbConfig.HOST, dialect: dbConfig.dialect, logging: false
                    });
                    (async () => {
                        const [rows] = await sequelize.query('SELECT client_id FROM work_orders WHERE id = $NEW_WO_ID');
                        console.log(rows[0].client_id);
                        await sequelize.close();
                    })();
                " | tail -1)

                if [ "$DB_CHECK" = "1" ]; then
                    print_success "Work order has client_id=1 in database"
                    run_test "Verify: client_id auto-assigned" "pass"
                else
                    print_error "Work order missing client_id in database"
                    run_test "Verify: client_id auto-assigned" "fail"
                fi
            else
                ERROR_MSG=$(echo "$CREATE_RESPONSE" | jq -r '.message')
                print_error "Failed to create: $ERROR_MSG"
                run_test "Create: $role can create work order" "fail"
            fi
        fi

    else
        ERROR_MSG=$(echo "$LOGIN_RESPONSE" | jq -r '.message')
        print_error "Login failed: $ERROR_MSG"
        run_test "Auth: $role login" "fail"
    fi

    echo ""
done

echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "TEST SUITE 2: Client Isolation Verification"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""

print_info "Verifying all users see same client data (Visionwest)..."

# Login with different roles and compare work order counts
declare -A WO_COUNTS

for role in "admin" "client_admin" "staff"; do
    email="${TEST_USERS[$role]}"

    LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"$TEST_PASSWORD\"}")

    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')

    WO_RESPONSE=$(curl -s -X GET "$BASE_URL/work-orders?limit=100" \
        -H "Authorization: Bearer $TOKEN")

    WO_COUNTS[$role]=$(echo "$WO_RESPONSE" | jq '.pagination.total')

    print_info "$role sees ${WO_COUNTS[$role]} work orders"
done

# Verify counts are consistent
if [ "${WO_COUNTS[admin]}" = "${WO_COUNTS[client_admin]}" ] && \
   [ "${WO_COUNTS[admin]}" = "${WO_COUNTS[staff]}" ]; then
    print_success "All admin/client_admin/staff roles see same client data"
    run_test "Isolation: Consistent client scoping" "pass"
else
    print_error "Different roles see different data counts!"
    run_test "Isolation: Consistent client scoping" "fail"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "📊 FINAL TEST RESULTS"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
PASS_RATE=$((TESTS_PASSED * 100 / TOTAL_TESTS))

echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $TESTS_PASSED"
echo "Failed: $TESTS_FAILED"
echo "Pass Rate: ${PASS_RATE}%"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    print_success "🎉 ALL TESTS PASSED! Multi-client implementation validated."
    exit 0
else
    print_warning "⚠️  $TESTS_FAILED test(s) failed. Review output above."
    exit 1
fi
