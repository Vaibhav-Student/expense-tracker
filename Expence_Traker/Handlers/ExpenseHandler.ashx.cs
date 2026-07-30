using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Web;
using System.Web.Script.Serialization;
using MySql.Data.MySqlClient;
using Expence_Traker.Helpers;

namespace Expence_Traker.Handlers
{
    public class ExpenseHandler : IHttpHandler
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
                if (string.Equals(action, "stats", StringComparison.OrdinalIgnoreCase))
                {
                    GetExpenseStats(context);
                }
                else if (string.Equals(action, "add", StringComparison.OrdinalIgnoreCase))
                {
                    AddExpense(context);
                }
                else if (string.Equals(action, "update", StringComparison.OrdinalIgnoreCase))
                {
                    UpdateExpense(context);
                }
                else if (string.Equals(action, "delete", StringComparison.OrdinalIgnoreCase))
                {
                    DeleteExpense(context);
                }
                else
                {
                    GetExpenses(context);
                }
            }
            catch (Exception ex)
            {
                context.Response.Write(new JavaScriptSerializer().Serialize(new { success = false, message = ex.Message }));
            }
        }

        private void GetExpenses(HttpContext context)
        {
            string search = context.Request.QueryString["search"];
            string category = context.Request.QueryString["category"];
            string payment = context.Request.QueryString["payment_method"];

            string sql = "SELECT id, amount, category, payment_method, DATE_FORMAT(date, '%Y-%m-%d') as date, description, status FROM expenses WHERE 1=1";
            List<MySqlParameter> pList = new List<MySqlParameter>();

            if (!string.IsNullOrEmpty(search))
            {
                sql += " AND (category LIKE @search OR description LIKE @search)";
                pList.Add(new MySqlParameter("@search", "%" + search + "%"));
            }
            if (!string.IsNullOrEmpty(category) && !category.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                sql += " AND category = @category";
                pList.Add(new MySqlParameter("@category", category));
            }
            if (!string.IsNullOrEmpty(payment) && !payment.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                sql += " AND payment_method = @payment";
                pList.Add(new MySqlParameter("@payment", payment));
            }

            sql += " ORDER BY date DESC, id DESC";
            DataTable dt = DbHelper.ExecuteQuery(sql, pList.ToArray());
            context.Response.Write(DbHelper.DataTableToJson(dt));
        }

        private void GetExpenseStats(HttpContext context)
        {
            object totalObj = DbHelper.ExecuteScalar("SELECT COALESCE(SUM(amount), 0) FROM expenses");
            object monthObj = DbHelper.ExecuteScalar("SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE YEAR(date) = YEAR(CURRENT_DATE()) AND MONTH(date) = MONTH(CURRENT_DATE())");
            object todayObj = DbHelper.ExecuteScalar("SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE date = CURRENT_DATE()");
            object countObj = DbHelper.ExecuteScalar("SELECT COUNT(*) FROM expenses");

            object maxObj = DbHelper.ExecuteScalar("SELECT COALESCE(MAX(amount), 0) FROM expenses");
            object minObj = DbHelper.ExecuteScalar("SELECT COALESCE(MIN(amount), 0) FROM expenses");
            object avgObj = DbHelper.ExecuteScalar("SELECT COALESCE(AVG(amount), 0) FROM expenses");
            object mostCategoryObj = DbHelper.ExecuteScalar("SELECT category FROM expenses GROUP BY category ORDER BY COUNT(*) DESC LIMIT 1");

            var stats = new
            {
                totalExpense = Convert.ToDecimal(totalObj),
                monthExpense = Convert.ToDecimal(monthObj),
                todayExpense = Convert.ToDecimal(todayObj),
                totalRecords = Convert.ToInt32(countObj),
                maxExpense = Convert.ToDecimal(maxObj),
                minExpense = Convert.ToDecimal(minObj),
                avgExpense = Math.Round(Convert.ToDecimal(avgObj), 2),
                mostCategory = mostCategoryObj != null ? mostCategoryObj.ToString() : "N/A"
            };

            context.Response.Write(new JavaScriptSerializer().Serialize(stats));
        }

        private void AddExpense(HttpContext context)
        {
            decimal amount = Convert.ToDecimal(GetParam(context, "amount"));
            string category = GetParam(context, "category");
            string paymentMethod = GetParam(context, "payment_method");
            string dateStr = GetParam(context, "date");
            string description = GetParam(context, "description") ?? "";

            DateTime date = DateTime.TryParse(dateStr, out DateTime d) ? d : DateTime.Today;

            string sql = "INSERT INTO expenses (amount, category, payment_method, date, description, status) VALUES (@amount, @category, @payment, @date, @desc, 'Paid')";
            MySqlParameter[] parameters = new MySqlParameter[]
            {
                new MySqlParameter("@amount", amount),
                new MySqlParameter("@category", category),
                new MySqlParameter("@payment", paymentMethod),
                new MySqlParameter("@date", date.ToString("yyyy-MM-dd")),
                new MySqlParameter("@desc", description)
            };

            long newId = DbHelper.ExecuteInsertAndGetId(sql, parameters);
            context.Response.Write(new JavaScriptSerializer().Serialize(new { success = true, id = newId, message = "Expense recorded successfully." }));
        }

        private void UpdateExpense(HttpContext context)
        {
            int id = Convert.ToInt32(GetParam(context, "id"));
            decimal amount = Convert.ToDecimal(GetParam(context, "amount"));
            string category = GetParam(context, "category");
            string paymentMethod = GetParam(context, "payment_method");
            string dateStr = GetParam(context, "date");
            string description = GetParam(context, "description") ?? "";

            DateTime date = DateTime.TryParse(dateStr, out DateTime d) ? d : DateTime.Today;

            string sql = "UPDATE expenses SET amount=@amount, category=@category, payment_method=@payment, date=@date, description=@desc WHERE id=@id";
            MySqlParameter[] parameters = new MySqlParameter[]
            {
                new MySqlParameter("@id", id),
                new MySqlParameter("@amount", amount),
                new MySqlParameter("@category", category),
                new MySqlParameter("@payment", paymentMethod),
                new MySqlParameter("@date", date.ToString("yyyy-MM-dd")),
                new MySqlParameter("@desc", description)
            };

            int rows = DbHelper.ExecuteNonQuery(sql, parameters);
            context.Response.Write(new JavaScriptSerializer().Serialize(new { success = rows > 0, message = rows > 0 ? "Expense updated." : "Record not found." }));
        }

        private void DeleteExpense(HttpContext context)
        {
            int id = Convert.ToInt32(GetParam(context, "id"));
            string sql = "DELETE FROM expenses WHERE id=@id";
            MySqlParameter[] parameters = new MySqlParameter[]
            {
                new MySqlParameter("@id", id)
            };

            int rows = DbHelper.ExecuteNonQuery(sql, parameters);
            context.Response.Write(new JavaScriptSerializer().Serialize(new { success = rows > 0, message = rows > 0 ? "Expense deleted." : "Record not found." }));
        }

        private string GetParam(HttpContext context, string key)
        {
            if (context.Items.Contains(key)) return context.Items[key]?.ToString();
            return context.Request.Form[key] ?? context.Request.QueryString[key];
        }

        public bool IsReusable => false;
    }
}
