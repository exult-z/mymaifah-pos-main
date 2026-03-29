import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Pure Java JUnit 4 unit tests for Maifah Tea Bong's Cafe POS logic.
 * No Android dependencies required.
 */
public class MaifahPOSTest {

    // ==================== DATA MODELS ====================

    static class MenuItem {
        String id;
        String name;
        double price;
        String category;

        MenuItem(String id, String name, double price, String category) {
            this.id = id;
            this.name = name;
            this.price = price;
            this.category = category;
        }
    }

    static class CartItem {
        String id;
        String name;
        double price;
        String category;
        int quantity;

        CartItem(String id, String name, double price, String category, int quantity) {
            this.id = id;
            this.name = name;
            this.price = price;
            this.category = category;
            this.quantity = quantity;
        }
    }

    static class Expense {
        String id;
        String description;
        double amount;
        String category;
        String date;

        Expense(String id, String description, double amount, String category, String date) {
            this.id = id;
            this.description = description;
            this.amount = amount;
            this.category = category;
            this.date = date;
        }
    }

    static class AppUser {
        String email;
        String fullName;
        String role;
        String password;

        AppUser(String email, String fullName, String role, String password) {
            this.email = email;
            this.fullName = fullName;
            this.role = role;
            this.password = password;
        }
    }

    // ==================== LOGIC CLASSES ====================

    static class CartLogic {
        List<CartItem> cart = new ArrayList<>();

        void addToCart(MenuItem item) {
            for (CartItem c : cart) {
                if (c.id.equals(item.id)) {
                    c.quantity++;
                    return;
                }
            }
            cart.add(new CartItem(item.id, item.name, item.price, item.category, 1));
        }

        void removeFromCart(String id) {
            for (int i = 0; i < cart.size(); i++) {
                if (cart.get(i).id.equals(id)) {
                    if (cart.get(i).quantity > 1) {
                        cart.get(i).quantity--;
                    } else {
                        cart.remove(i);
                    }
                    return;
                }
            }
        }

        double getCartTotal() {
            double sum = 0;
            for (CartItem c : cart) sum += c.price * c.quantity;
            return sum;
        }

        int getCartCount() {
            int count = 0;
            for (CartItem c : cart) count += c.quantity;
            return count;
        }
    }

    static class AuthLogic {
        List<AppUser> users = new ArrayList<>();

        AuthLogic() {
            users.add(new AppUser("admin@maifah.com", "Admin", "Owner", "admin123"));
        }

        AppUser login(String email, String password) {
            for (AppUser u : users) {
                if (u.email.equals(email) && u.password.equals(password)) return u;
            }
            return null;
        }

        boolean register(String fullName, String email, String password, String role) {
            for (AppUser u : users) {
                if (u.email.equals(email)) return false;
            }
            users.add(new AppUser(email, fullName, role, password));
            return true;
        }
    }

    static class ExpenseLogic {
        List<Expense> expenses = new ArrayList<>();

        void addExpense(Expense e) {
            expenses.add(e);
        }

        void deleteExpense(String id) {
            expenses.removeIf(e -> e.id.equals(id));
        }

        double getTodayExpenses(String todayDate) {
            double sum = 0;
            for (Expense e : expenses) {
                if (e.date.equals(todayDate)) sum += e.amount;
            }
            return sum;
        }

        double getNetProfit(double revenue, String todayDate) {
            return revenue - getTodayExpenses(todayDate);
        }
    }

    static class MenuLogic {
        List<MenuItem> items = new ArrayList<>();

        MenuLogic() {
            items.add(new MenuItem("sm1", "Chicken Pastil", 25, "Sulit Meals"));
            items.add(new MenuItem("sm2", "Pork Sisig", 25, "Sulit Meals"));
            items.add(new MenuItem("sl1", "Longganisa", 55, "Silog Meals"));
            items.add(new MenuItem("ff1", "Fish Tofu (12)", 80, "Finger Foods"));
            items.add(new MenuItem("al1", "Whole Fried Chicken Oriental", 350, "A La Carte"));
        }

        List<MenuItem> getAllItems() {
            return items;
        }

        List<MenuItem> getByCategory(String category) {
            return items.stream().filter(i -> i.category.equals(category)).collect(Collectors.toList());
        }

        List<MenuItem> search(String query) {
            if (query == null || query.isEmpty()) return items;
            String lower = query.toLowerCase();
            return items.stream().filter(i -> i.name.toLowerCase().contains(lower)).collect(Collectors.toList());
        }
    }

    // ==================== TEST FIELDS ====================

    private CartLogic cartLogic;
    private AuthLogic authLogic;
    private ExpenseLogic expenseLogic;
    private MenuLogic menuLogic;

    @Before
    public void setUp() {
        cartLogic = new CartLogic();
        authLogic = new AuthLogic();
        expenseLogic = new ExpenseLogic();
        menuLogic = new MenuLogic();
    }

    // ==================== CART TESTS ====================

    @Test
    public void addToCart_newItem_setsQtyTo1() {
        MenuItem item = new MenuItem("t1", "Test Item", 100, "Test");
        cartLogic.addToCart(item);
        Assert.assertEquals(1, cartLogic.cart.get(0).quantity);
    }

    @Test
    public void addToCart_sameItemTwice_setsQtyTo2() {
        MenuItem item = new MenuItem("t1", "Test Item", 100, "Test");
        cartLogic.addToCart(item);
        cartLogic.addToCart(item);
        Assert.assertEquals(1, cartLogic.cart.size());
        Assert.assertEquals(2, cartLogic.cart.get(0).quantity);
    }

    @Test
    public void removeFromCart_decreasesQtyBy1() {
        MenuItem item = new MenuItem("t1", "Test Item", 100, "Test");
        cartLogic.addToCart(item);
        cartLogic.addToCart(item);
        cartLogic.removeFromCart("t1");
        Assert.assertEquals(1, cartLogic.cart.get(0).quantity);
    }

    @Test
    public void removeFromCart_lastItem_removesFromCart() {
        MenuItem item = new MenuItem("t1", "Test Item", 100, "Test");
        cartLogic.addToCart(item);
        cartLogic.removeFromCart("t1");
        Assert.assertTrue(cartLogic.cart.isEmpty());
    }

    @Test
    public void getCartTotal_singleItem_returnsCorrectSum() {
        MenuItem item = new MenuItem("t1", "Test Item", 50, "Test");
        cartLogic.addToCart(item);
        Assert.assertEquals(50.0, cartLogic.getCartTotal(), 0.01);
    }

    @Test
    public void getCartTotal_multipleItems_returnsCorrectSum() {
        cartLogic.addToCart(new MenuItem("t1", "A", 50, "Test"));
        cartLogic.addToCart(new MenuItem("t2", "B", 30, "Test"));
        cartLogic.addToCart(new MenuItem("t1", "A", 50, "Test")); // qty 2
        Assert.assertEquals(130.0, cartLogic.getCartTotal(), 0.01);
    }

    @Test
    public void getCartTotal_emptyCart_returns0() {
        Assert.assertEquals(0.0, cartLogic.getCartTotal(), 0.01);
    }

    @Test
    public void getCartCount_returnsTotalQuantity() {
        cartLogic.addToCart(new MenuItem("t1", "A", 50, "Test"));
        cartLogic.addToCart(new MenuItem("t1", "A", 50, "Test"));
        cartLogic.addToCart(new MenuItem("t2", "B", 30, "Test"));
        Assert.assertEquals(3, cartLogic.getCartCount());
    }

    // ==================== AUTH TESTS ====================

    @Test
    public void login_validCredentials_returnsUser() {
        AppUser user = authLogic.login("admin@maifah.com", "admin123");
        Assert.assertNotNull(user);
        Assert.assertEquals("admin@maifah.com", user.email);
    }

    @Test
    public void login_wrongPassword_returnsNull() {
        Assert.assertNull(authLogic.login("admin@maifah.com", "wrong"));
    }

    @Test
    public void login_unknownEmail_returnsNull() {
        Assert.assertNull(authLogic.login("unknown@test.com", "admin123"));
    }

    @Test
    public void register_newEmail_returnsTrue() {
        Assert.assertTrue(authLogic.register("John", "john@test.com", "pass123", "Cashier"));
    }

    @Test
    public void register_duplicateEmail_returnsFalse() {
        Assert.assertFalse(authLogic.register("Admin2", "admin@maifah.com", "pass", "Owner"));
    }

    @Test
    public void register_newUser_canLoginAfterwards() {
        authLogic.register("Jane", "jane@test.com", "secret", "Manager");
        AppUser user = authLogic.login("jane@test.com", "secret");
        Assert.assertNotNull(user);
        Assert.assertEquals("Jane", user.fullName);
    }

    // ==================== EXPENSE TESTS ====================

    @Test
    public void addExpense_increasesCountBy1() {
        expenseLogic.addExpense(new Expense("e1", "Sugar", 100, "Ingredients", "2026-03-15"));
        Assert.assertEquals(1, expenseLogic.expenses.size());
    }

    @Test
    public void deleteExpense_removesCorrectById() {
        expenseLogic.addExpense(new Expense("e1", "Sugar", 100, "Ingredients", "2026-03-15"));
        expenseLogic.addExpense(new Expense("e2", "Cups", 50, "Supplies", "2026-03-15"));
        expenseLogic.deleteExpense("e1");
        Assert.assertEquals(1, expenseLogic.expenses.size());
        Assert.assertEquals("e2", expenseLogic.expenses.get(0).id);
    }

    @Test
    public void getTodayExpenses_returnsCorrectSum() {
        expenseLogic.addExpense(new Expense("e1", "Sugar", 100, "Ingredients", "2026-03-15"));
        expenseLogic.addExpense(new Expense("e2", "Cups", 50, "Supplies", "2026-03-15"));
        expenseLogic.addExpense(new Expense("e3", "Old", 200, "Other", "2026-03-14"));
        Assert.assertEquals(150.0, expenseLogic.getTodayExpenses("2026-03-15"), 0.01);
    }

    @Test
    public void getNetProfit_returnsRevenueMinusExpenses() {
        expenseLogic.addExpense(new Expense("e1", "Sugar", 100, "Ingredients", "2026-03-15"));
        Assert.assertEquals(400.0, expenseLogic.getNetProfit(500, "2026-03-15"), 0.01);
    }

    @Test
    public void getNetProfit_canReturnNegative() {
        expenseLogic.addExpense(new Expense("e1", "Rent", 1000, "Rent", "2026-03-15"));
        Assert.assertEquals(-800.0, expenseLogic.getNetProfit(200, "2026-03-15"), 0.01);
    }

    // ==================== MENU TESTS ====================

    @Test
    public void getAllItems_returnsNonEmptyList() {
        Assert.assertFalse(menuLogic.getAllItems().isEmpty());
    }

    @Test
    public void getByCategory_returnsCorrectItems() {
        List<MenuItem> sulitMeals = menuLogic.getByCategory("Sulit Meals");
        Assert.assertEquals(2, sulitMeals.size());
        for (MenuItem item : sulitMeals) {
            Assert.assertEquals("Sulit Meals", item.category);
        }
    }

    @Test
    public void search_isCaseInsensitive() {
        List<MenuItem> results = menuLogic.search("chicken");
        Assert.assertFalse(results.isEmpty());
        Assert.assertTrue(results.stream().anyMatch(i -> i.name.contains("Chicken")));
    }

    @Test
    public void search_noMatch_returnsEmptyList() {
        List<MenuItem> results = menuLogic.search("pizza");
        Assert.assertTrue(results.isEmpty());
    }

    @Test
    public void search_emptyQuery_returnsAllItems() {
        List<MenuItem> results = menuLogic.search("");
        Assert.assertEquals(menuLogic.getAllItems().size(), results.size());
    }
}
