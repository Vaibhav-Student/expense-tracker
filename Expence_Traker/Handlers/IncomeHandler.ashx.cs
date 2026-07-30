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
    public class IncomeHandler : IHttpHandler
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
                    GetIncomeStats(context);
                }
                else if (string.Equals(action, "add", StringComparison.OrdinalIgnoreCase))
                {
                    AddIncome(context);
                }
                else if (string.Equals(action, "update", StringComparison.OrdinalIgnoreCase))
                {
                    UpdateIncome(context);
                }
                else if (string.Equals(action, "delete", StringComparison.OrdinalIgnoreCase))
                {
                    DeleteIncome(context);
                }
                else
                {
                    GetIncome(context);
                }
            }
            catch (Exception ex)
            {
                context.Response.Write(new JavaScriptSerializer().Serialize(new { success = false, message = ex.Message }));
            }
        }

        private void GetIncome(HttpContext context)
        {
            string search = context.Request.QueryString["search"];
            string source = context.Request.QueryString["source"];

            string sql = "SELECT id, amount, source, DATE_FORMAT(date, '%Y-%m-%d') as date, description FROM income WHERE 1=1";
            List<MySqlParameter> pList = new List<MySqlParameter>();

            if (!string.IsNullOrEmpty(search))
            {
                sql += " AND (source LIKE @search OR description LIKE @search)";
                pList.Add(new MySqlParameter("@search", "%" + search + "%"));
            }
            if (!string.IsNullOrEmpty(source) && !source.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                sql += " AND source = @source";
                pList.Add(new MySqlParameter("@source", source));
            }

            sql += " ORDER BY date DESC, id DESC";
            DataTable dt = DbHelper.ExecuteQuery(sql, pList.ToArray());
            context.Response.Write(DbHelper.DataTableToJson(dt));
        }

        private void GetIncomeStats(HttpContext context)
        {
            object totalObj = DbHelper.ExecuteScalar("SELECT COALESCE(SUM(amount), 0) FROM income");
            object monthObj = DbHelper.ExecuteScalar("SELECT COALESCE(SUM(amount), 0) FROM income WHERE YEAR(date) = YEAR(CURRENT_DATE()) AND MONTH(date) = MONTH(CURRENT_DATE())");
            object todayObj = DbHelper.ExecuteScalar("SELECT COALESCE(SUM(amount), 0) FROM income WHERE date = CURRENT_DATE()");
            object countObj = DbHelper.ExecuteScalar("SELECT COUNT(*) FROM income");

            var stats = new
            {
                totalIncome = Convert.ToDecimal(totalObj),
                monthIncome = Convert.ToDecimal(monthObj),
                todayIncome = Convert.ToDecimal(todayObj),
                totalEntries = Convert.ToInt32(countObj)
            };

            context.Response.Write(new JavaScriptSerializer().Serialize(stats));
        }

        private void AddIncome(HttpContext context)
        {
            decimal amount = Convert.ToDecimal(GetParam(context, "amount"));
            string source = GetParam(context, "source");
            string dateStr = GetParam(context, "date");
            string description = GetParam(context, "description") ?? "";

            DateTime date = DateTime.TryParse(dateStr, out DateTime d) ? d : DateTime.Today;

            string sql = "INSERT INTO income (amount, source, date, description) VALUES (@amount, @source, @date, @desc)";
            MySqlParameter[] parameters = new MySqlParameter[]
            {
                new MySqlParameter("@amount", amount),
                new MySqlParameter("@source", source),
                new MySqlParameter("@date", date.ToString("yyyy-MM-dd")),
                new MySqlParameter("@desc", description)
            };

            long newId = DbHelper.ExecuteInsertAndGetId(sql, parameters);
            context.Response.Write(new JavaScriptSerializer().Serialize(new { success = true, id = newId, message = "Income recorded successfully." }));
        }

        private void UpdateIncome(HttpContext context)
        {
            int id = Convert.ToInt32(GetParam(context, "id"));
            decimal amount = Convert.ToDecimal(GetParam(context, "amount"));
            string source = GetParam(context, "source");
            string dateStr = GetParam(context, "date");
            string description = GetParam(context, "description") ?? "";

            DateTime date = DateTime.TryParse(dateStr, out DateTime d) ? d : DateTime.Today;

            string sql = "UPDATE income SET amount=@amount, source=@source, date=@date, description=@desc WHERE id=@id";
            MySqlParameter[] parameters = new MySqlParameter[]
            {
                new MySqlParameter("@id", id),
                new MySqlParameter("@amount", amount),
                new MySqlParameter("@source", source),
                new MySqlParameter("@date", date.ToString("yyyy-MM-dd")),
                new MySqlParameter("@desc", description)
            };

            int rows = DbHelper.ExecuteNonQuery(sql, parameters);
            context.Response.Write(new JavaScriptSerializer().Serialize(new { success = rows > 0, message = rows > 0 ? "Income updated." : "Record not found." }));
        }

        private void DeleteIncome(HttpContext context)
        {
            int id = Convert.ToInt32(GetParam(context, "id"));
            string sql = "DELETE FROM income WHERE id=@id";
            MySqlParameter[] parameters = new MySqlParameter[]
            {
                new MySqlParameter("@id", id)
            };

            int rows = DbHelper.ExecuteNonQuery(sql, parameters);
            context.Response.Write(new JavaScriptSerializer().Serialize(new { success = rows > 0, message = rows > 0 ? "Income deleted." : "Record not found." }));
        }

        private string GetParam(HttpContext context, string key)
        {
            if (context.Items.Contains(key)) return context.Items[key]?.ToString();
            return context.Request.Form[key] ?? context.Request.QueryString[key];
        }

        public bool IsReusable => false;
    }
}
