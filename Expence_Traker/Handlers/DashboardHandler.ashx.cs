using System;
using System.Collections.Generic;
using System.Data;
using System.Web;
using System.Web.Script.Serialization;
using Expence_Traker.Helpers;

namespace Expence_Traker.Handlers
{
    public class DashboardHandler : IHttpHandler
    {
        public void ProcessRequest(HttpContext context)
        {
            context.Response.ContentType = "application/json";

            try
            {
                object totalIncomeObj = DbHelper.ExecuteScalar("SELECT COALESCE(SUM(amount), 0) FROM income");
                object totalExpenseObj = DbHelper.ExecuteScalar("SELECT COALESCE(SUM(amount), 0) FROM expenses");
                object categoryCountObj = DbHelper.ExecuteScalar("SELECT COUNT(*) FROM categories WHERE status='Active'");

                decimal totalIncome = Convert.ToDecimal(totalIncomeObj);
                decimal totalExpense = Convert.ToDecimal(totalExpenseObj);
                decimal totalBalance = totalIncome - totalExpense;
                int categoryCount = Convert.ToInt32(categoryCountObj);

                // Recent Transactions (Combine income and expenses)
                string recentQuery = @"
                    (SELECT id, 'Expense' as type, category as source_or_category, amount, DATE_FORMAT(date, '%Y-%m-%d') as date, description FROM expenses)
                    UNION ALL
                    (SELECT id, 'Income' as type, source as source_or_category, amount, DATE_FORMAT(date, '%Y-%m-%d') as date, description FROM income)
                    ORDER BY date DESC LIMIT 6";

                DataTable dtRecent = DbHelper.ExecuteQuery(recentQuery);

                // Category breakdown
                string catBreakdownQuery = "SELECT category, SUM(amount) as total_amount, COUNT(*) as count FROM expenses GROUP BY category ORDER BY total_amount DESC";
                DataTable dtCatBreakdown = DbHelper.ExecuteQuery(catBreakdownQuery);

                var js = new JavaScriptSerializer();
                var result = new
                {
                    totalBalance = totalBalance,
                    totalIncome = totalIncome,
                    totalExpense = totalExpense,
                    activeCategories = categoryCount,
                    recentTransactions = js.Deserialize<object>(DbHelper.DataTableToJson(dtRecent)),
                    categoryBreakdown = js.Deserialize<object>(DbHelper.DataTableToJson(dtCatBreakdown))
                };

                context.Response.Write(js.Serialize(result));
            }
            catch (Exception ex)
            {
                context.Response.Write(new JavaScriptSerializer().Serialize(new { success = false, message = ex.Message }));
            }
        }

        public bool IsReusable => false;
    }
}
