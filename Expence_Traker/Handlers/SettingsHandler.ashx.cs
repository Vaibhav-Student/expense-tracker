using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Text;
using System.Web;
using System.Web.Script.Serialization;
using MySql.Data.MySqlClient;
using Expence_Traker.Helpers;

namespace Expence_Traker.Handlers
{
    public class SettingsHandler : IHttpHandler
    {
        public void ProcessRequest(HttpContext context)
        {
            context.Response.ContentType = "application/json";
            string action = context.Request.QueryString["action"] ?? context.Request.Form["action"];

            if (string.IsNullOrEmpty(action) && context.Request.HttpMethod == "POST")
            {
                using (var reader = new StreamReader(context.Request.InputStream))
                {
                    string jsonStr = reader.ReadToEnd();
                    if (!string.IsNullOrEmpty(jsonStr))
                    {
                        var js = new JavaScriptSerializer();
                        var dict = js.Deserialize<Dictionary<string, object>>(jsonStr);
                        if (dict != null && dict.ContainsKey("action"))
                        {
                            action = dict["action"].ToString();
                            foreach (var key in dict.Keys)
                            {
                                context.Items[key] = dict[key];
                            }
                        }
                    }
                }
            }

            try
            {
                if (string.Equals(action, "save", StringComparison.OrdinalIgnoreCase))
                {
                    SaveSettings(context);
                }
                else if (string.Equals(action, "export", StringComparison.OrdinalIgnoreCase))
                {
                    ExportData(context);
                }
                else if (string.Equals(action, "import", StringComparison.OrdinalIgnoreCase))
                {
                    ImportData(context);
                }
                else if (string.Equals(action, "reset", StringComparison.OrdinalIgnoreCase))
                {
                    ResetData(context);
                }
                else
                {
                    GetSettings(context);
                }
            }
            catch (Exception ex)
            {
                context.Response.Write(new JavaScriptSerializer().Serialize(new { success = false, message = ex.Message }));
            }
        }

        private void GetSettings(HttpContext context)
        {
            DataTable dt = DbHelper.ExecuteQuery("SELECT * FROM settings ORDER BY id ASC LIMIT 1");
            if (dt.Rows.Count > 0)
            {
                DataRow r = dt.Rows[0];
                var s = new
                {
                    theme = r.Table.Columns.Contains("theme") ? r["theme"].ToString() : "Light",
                    currency = r["currency"].ToString(),
                    date_format = r["date_format"].ToString(),
                    notify_enable = r.Table.Columns.Contains("notify_enable") ? Convert.ToInt32(r["notify_enable"]) == 1 : true,
                    expense_reminder = r.Table.Columns.Contains("expense_reminder") ? Convert.ToInt32(r["expense_reminder"]) == 1 : true,
                    monthly_report = r.Table.Columns.Contains("monthly_report") ? Convert.ToInt32(r["monthly_report"]) == 1 : true
                };
                context.Response.Write(new JavaScriptSerializer().Serialize(s));
            }
            else
            {
                var s = new
                {
                    theme = "Light",
                    currency = "INR",
                    date_format = "DD/MM/YYYY",
                    notify_enable = true,
                    expense_reminder = true,
                    monthly_report = true
                };
                context.Response.Write(new JavaScriptSerializer().Serialize(s));
            }
        }

        private void SaveSettings(HttpContext context)
        {
            string theme = GetParam(context, "theme") ?? "Light";
            string currency = GetParam(context, "currency") ?? "INR";
            string dateFormat = GetParam(context, "date_format") ?? "DD/MM/YYYY";
            bool notifyEnable = Convert.ToBoolean(GetParam(context, "notify_enable"));
            bool expenseReminder = Convert.ToBoolean(GetParam(context, "expense_reminder"));
            bool monthlyReport = Convert.ToBoolean(GetParam(context, "monthly_report"));

            // Ensure settings table has proper columns
            EnsureSettingsColumns();

            string checkSql = "SELECT COUNT(*) FROM settings";
            int count = Convert.ToInt32(DbHelper.ExecuteScalar(checkSql));

            string sql;
            MySqlParameter[] p = new MySqlParameter[]
            {
                new MySqlParameter("@theme", theme),
                new MySqlParameter("@currency", currency),
                new MySqlParameter("@format", dateFormat),
                new MySqlParameter("@notify", notifyEnable ? 1 : 0),
                new MySqlParameter("@reminder", expenseReminder ? 1 : 0),
                new MySqlParameter("@report", monthlyReport ? 1 : 0)
            };

            if (count > 0)
            {
                sql = "UPDATE settings SET theme=@theme, currency=@currency, date_format=@format, notify_enable=@notify, expense_reminder=@reminder, monthly_report=@report WHERE id=1";
            }
            else
            {
                sql = "INSERT INTO settings (id, theme, currency, date_format, notify_enable, expense_reminder, monthly_report) VALUES (1, @theme, @currency, @format, @notify, @reminder, @report)";
            }

            DbHelper.ExecuteNonQuery(sql, p);
            context.Response.Write(new JavaScriptSerializer().Serialize(new { success = true, message = "Settings & preferences saved successfully to MySQL." }));
        }

        private void EnsureSettingsColumns()
        {
            try
            {
                DbHelper.ExecuteNonQuery("ALTER TABLE settings ADD COLUMN IF NOT EXISTS theme VARCHAR(20) DEFAULT 'Light'");
                DbHelper.ExecuteNonQuery("ALTER TABLE settings ADD COLUMN IF NOT EXISTS notify_enable TINYINT(1) DEFAULT 1");
                DbHelper.ExecuteNonQuery("ALTER TABLE settings ADD COLUMN IF NOT EXISTS expense_reminder TINYINT(1) DEFAULT 1");
                DbHelper.ExecuteNonQuery("ALTER TABLE settings ADD COLUMN IF NOT EXISTS monthly_report TINYINT(1) DEFAULT 1");
            }
            catch
            {
                // Columns already exist or engine variation ignored
            }
        }

        private void ExportData(HttpContext context)
        {
            DataTable dtCategories = DbHelper.ExecuteQuery("SELECT * FROM categories");
            DataTable dtExpenses = DbHelper.ExecuteQuery("SELECT * FROM expenses");
            DataTable dtIncome = DbHelper.ExecuteQuery("SELECT * FROM income");
            DataTable dtSettings = DbHelper.ExecuteQuery("SELECT * FROM settings");

            var js = new JavaScriptSerializer();
            var backup = new
            {
                export_date = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                categories = js.Deserialize<object>(DbHelper.DataTableToJson(dtCategories)),
                expenses = js.Deserialize<object>(DbHelper.DataTableToJson(dtExpenses)),
                income = js.Deserialize<object>(DbHelper.DataTableToJson(dtIncome)),
                settings = js.Deserialize<object>(DbHelper.DataTableToJson(dtSettings))
            };

            context.Response.ContentType = "application/json";
            context.Response.AddHeader("Content-Disposition", "attachment; filename=ExpenseTracker_Backup.json");
            context.Response.Write(js.Serialize(backup));
        }

        private void ImportData(HttpContext context)
        {
            string jsonContent = GetParam(context, "json_data");
            if (string.IsNullOrEmpty(jsonContent) && context.Request.Files.Count > 0)
            {
                using (var reader = new StreamReader(context.Request.Files[0].InputStream))
                {
                    jsonContent = reader.ReadToEnd();
                }
            }

            if (string.IsNullOrEmpty(jsonContent))
            {
                context.Response.Write(new JavaScriptSerializer().Serialize(new { success = false, message = "No valid JSON file provided." }));
                return;
            }

            var js = new JavaScriptSerializer();
            var backupData = js.Deserialize<Dictionary<string, object>>(jsonContent);

            if (backupData == null)
            {
                context.Response.Write(new JavaScriptSerializer().Serialize(new { success = false, message = "Invalid JSON structure." }));
                return;
            }

            // Restore Categories
            if (backupData.ContainsKey("categories") && backupData["categories"] is System.Collections.ArrayList catList)
            {
                DbHelper.ExecuteNonQuery("DELETE FROM categories");
                foreach (Dictionary<string, object> cat in catList)
                {
                    string sql = "INSERT INTO categories (id, name, icon, color, description, status) VALUES (@id, @name, @icon, @color, @desc, @status)";
                    DbHelper.ExecuteNonQuery(sql, new MySqlParameter[]
                    {
                        new MySqlParameter("@id", cat.ContainsKey("id") ? cat["id"] : 0),
                        new MySqlParameter("@name", cat.ContainsKey("name") ? cat["name"] : "General"),
                        new MySqlParameter("@icon", cat.ContainsKey("icon") ? cat["icon"] : "📦"),
                        new MySqlParameter("@color", cat.ContainsKey("color") ? cat["color"] : "Blue"),
                        new MySqlParameter("@desc", cat.ContainsKey("description") ? cat["description"] : ""),
                        new MySqlParameter("@status", cat.ContainsKey("status") ? cat["status"] : "Active")
                    });
                }
            }

            // Restore Expenses
            if (backupData.ContainsKey("expenses") && backupData["expenses"] is System.Collections.ArrayList expList)
            {
                DbHelper.ExecuteNonQuery("DELETE FROM expenses");
                foreach (Dictionary<string, object> exp in expList)
                {
                    string sql = "INSERT INTO expenses (id, amount, category, payment_method, date, description, status) VALUES (@id, @amt, @cat, @pay, @date, @desc, @status)";
                    DbHelper.ExecuteNonQuery(sql, new MySqlParameter[]
                    {
                        new MySqlParameter("@id", exp.ContainsKey("id") ? exp["id"] : 0),
                        new MySqlParameter("@amt", exp.ContainsKey("amount") ? exp["amount"] : 0),
                        new MySqlParameter("@cat", exp.ContainsKey("category") ? exp["category"] : "Other"),
                        new MySqlParameter("@pay", exp.ContainsKey("payment_method") ? exp["payment_method"] : "Cash"),
                        new MySqlParameter("@date", exp.ContainsKey("date") ? exp["date"] : DateTime.Today.ToString("yyyy-MM-dd")),
                        new MySqlParameter("@desc", exp.ContainsKey("description") ? exp["description"] : ""),
                        new MySqlParameter("@status", exp.ContainsKey("status") ? exp["status"] : "Paid")
                    });
                }
            }

            // Restore Income
            if (backupData.ContainsKey("income") && backupData["income"] is System.Collections.ArrayList incList)
            {
                DbHelper.ExecuteNonQuery("DELETE FROM income");
                foreach (Dictionary<string, object> inc in incList)
                {
                    string sql = "INSERT INTO income (id, amount, source, date, description) VALUES (@id, @amt, @src, @date, @desc)";
                    DbHelper.ExecuteNonQuery(sql, new MySqlParameter[]
                    {
                        new MySqlParameter("@id", inc.ContainsKey("id") ? inc["id"] : 0),
                        new MySqlParameter("@amt", inc.ContainsKey("amount") ? inc["amount"] : 0),
                        new MySqlParameter("@src", inc.ContainsKey("source") ? inc["source"] : "Other"),
                        new MySqlParameter("@date", inc.ContainsKey("date") ? inc["date"] : DateTime.Today.ToString("yyyy-MM-dd")),
                        new MySqlParameter("@desc", inc.ContainsKey("description") ? inc["description"] : "")
                    });
                }
            }

            context.Response.Write(js.Serialize(new { success = true, message = "Data backup imported and restored into MySQL successfully!" }));
        }

        private void ResetData(HttpContext context)
        {
            DbHelper.ExecuteNonQuery("DELETE FROM expenses");
            DbHelper.ExecuteNonQuery("DELETE FROM income");
            DbHelper.ExecuteNonQuery("DELETE FROM categories");

            // Seed default categories
            string seedCategories = @"
                INSERT INTO categories (id, name, icon, color, description, status) VALUES
                (1, 'Food', '🍔', 'Green', 'Daily food expenses', 'Active'),
                (2, 'Shopping', '🛍', 'Blue', 'Clothes and accessories', 'Active'),
                (3, 'Travel', '🚌', 'Orange', 'Travel expenses', 'Active'),
                (4, 'Medical', '💊', 'Red', 'Medicine and hospital', 'Active'),
                (5, 'Bills', '💡', 'Yellow', 'Electricity, Water, Internet', 'Active'),
                (6, 'Entertainment', '🎬', 'Purple', 'Movies and games', 'Active'),
                (7, 'Education', '📚', 'Blue', 'Tuition, books, and online courses', 'Active'),
                (8, 'Other', '📦', 'Grey', 'Miscellaneous personal expenses', 'Active');";
            DbHelper.ExecuteNonQuery(seedCategories);

            // Seed default expenses
            string seedExpenses = @"
                INSERT INTO expenses (id, amount, category, payment_method, date, description, status) VALUES
                (1, 250.00, 'Food', 'UPI', '2026-07-21', 'Lunch', 'Paid'),
                (2, 120.00, 'Travel', 'Cash', '2026-07-22', 'Bus Ticket', 'Paid'),
                (3, 950.00, 'Shopping', 'Credit Card', '2026-07-24', 'T-Shirt', 'Paid'),
                (4, 450.00, 'Medical', 'UPI', '2026-07-25', 'Medicine', 'Paid');";
            DbHelper.ExecuteNonQuery(seedExpenses);

            // Seed default income
            string seedIncome = @"
                INSERT INTO income (id, amount, source, date, description) VALUES
                (1, 25000.00, 'Salary', '2026-07-20', 'Monthly Salary'),
                (2, 5000.00, 'Freelancing', '2026-07-25', 'Website Project'),
                (3, 3000.00, 'Bonus', '2026-07-28', 'Performance Bonus');";
            DbHelper.ExecuteNonQuery(seedIncome);

            // Reset settings
            SaveSettings(context);
        }

        private string GetParam(HttpContext context, string key)
        {
            if (context.Items.Contains(key)) return context.Items[key]?.ToString();
            return context.Request.Form[key] ?? context.Request.QueryString[key];
        }

        public bool IsReusable => false;
    }
}
