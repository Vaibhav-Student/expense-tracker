using System;
using System.Collections.Generic;
using System.Data;
using System.Globalization;
using System.Web;
using System.Web.Script.Serialization;
using MySql.Data.MySqlClient;
using Expence_Traker.Helpers;

namespace Expence_Traker.Handlers
{
    public class ReportHandler : IHttpHandler
    {
        public void ProcessRequest(HttpContext context)
        {
            context.Response.ContentType = "application/json";

            try
            {
                string monthParam = context.Request.QueryString["month"] ?? "All";
                string yearParam = context.Request.QueryString["year"] ?? DateTime.Now.Year.ToString();

                int year = int.TryParse(yearParam, out int y) ? y : DateTime.Now.Year;
                int month = 0;
                if (!monthParam.Equals("All", StringComparison.OrdinalIgnoreCase))
                {
                    if (!int.TryParse(monthParam, out month))
                    {
                        DateTime dummyDate;
                        if (DateTime.TryParseExact(monthParam, "MMMM", CultureInfo.InvariantCulture, DateTimeStyles.None, out dummyDate))
                        {
                            month = dummyDate.Month;
                        }
                    }
                }

                // 1. Total Income & Expense based on Filter
                string incomeFilter = "WHERE YEAR(date) = @year";
                string expenseFilter = "WHERE YEAR(date) = @year";
                List<MySqlParameter> incParams = new List<MySqlParameter> { new MySqlParameter("@year", year) };
                List<MySqlParameter> expParams = new List<MySqlParameter> { new MySqlParameter("@year", year) };

                if (month > 0)
                {
                    incomeFilter += " AND MONTH(date) = @month";
                    expenseFilter += " AND MONTH(date) = @month";
                    incParams.Add(new MySqlParameter("@month", month));
                    expParams.Add(new MySqlParameter("@month", month));
                }

                object totalIncomeObj = DbHelper.ExecuteScalar("SELECT COALESCE(SUM(amount), 0) FROM income " + incomeFilter, incParams.ToArray());
                object totalExpenseObj = DbHelper.ExecuteScalar("SELECT COALESCE(SUM(amount), 0) FROM expenses " + expenseFilter, expParams.ToArray());
                object incomeCountObj = DbHelper.ExecuteScalar("SELECT COUNT(*) FROM income " + incomeFilter, incParams.ToArray());
                object expenseCountObj = DbHelper.ExecuteScalar("SELECT COUNT(*) FROM expenses " + expenseFilter, expParams.ToArray());

                decimal totalIncome = Convert.ToDecimal(totalIncomeObj);
                decimal totalExpense = Convert.ToDecimal(totalExpenseObj);
                decimal currentBalance = totalIncome - totalExpense;
                int totalTransactions = Convert.ToInt32(incomeCountObj) + Convert.ToInt32(expenseCountObj);

                // 2. Financial Summary Highlights
                object maxIncomeObj = DbHelper.ExecuteScalar("SELECT COALESCE(MAX(amount), 0) FROM income " + incomeFilter, incParams.ToArray());
                object maxExpenseObj = DbHelper.ExecuteScalar("SELECT COALESCE(MAX(amount), 0) FROM expenses " + expenseFilter, expParams.ToArray());
                object topCategoryObj = DbHelper.ExecuteScalar("SELECT category FROM expenses " + expenseFilter + " GROUP BY category ORDER BY SUM(amount) DESC LIMIT 1", expParams.ToArray());

                // 3. Category Breakdown with Percentages
                string catSql = "SELECT category, SUM(amount) as total FROM expenses " + expenseFilter + " GROUP BY category ORDER BY total DESC";
                DataTable dtCat = DbHelper.ExecuteQuery(catSql, expParams.ToArray());

                List<object> categoryBreakdown = new List<object>();
                foreach (DataRow row in dtCat.Rows)
                {
                    decimal amt = Convert.ToDecimal(row["total"]);
                    double percentage = totalExpense > 0 ? Math.Round((double)(amt / totalExpense) * 100, 1) : 0;
                    categoryBreakdown.Add(new
                    {
                        category = row["category"].ToString(),
                        amount = amt,
                        percentage = percentage
                    });
                }

                // 4. 12-Month Trend for Line Chart & Monthly Table
                decimal[] monthlyExpenses = new decimal[12];
                decimal[] monthlyIncomes = new decimal[12];

                string mExpSql = "SELECT MONTH(date) as m, SUM(amount) as total FROM expenses WHERE YEAR(date) = @year GROUP BY MONTH(date)";
                DataTable dtMExp = DbHelper.ExecuteQuery(mExpSql, new MySqlParameter[] { new MySqlParameter("@year", year) });
                foreach (DataRow r in dtMExp.Rows)
                {
                    int mIdx = Convert.ToInt32(r["m"]) - 1;
                    if (mIdx >= 0 && mIdx < 12) monthlyExpenses[mIdx] = Convert.ToDecimal(r["total"]);
                }

                string mIncSql = "SELECT MONTH(date) as m, SUM(amount) as total FROM income WHERE YEAR(date) = @year GROUP BY MONTH(date)";
                DataTable dtMInc = DbHelper.ExecuteQuery(mIncSql, new MySqlParameter[] { new MySqlParameter("@year", year) });
                foreach (DataRow r in dtMInc.Rows)
                {
                    int mIdx = Convert.ToInt32(r["m"]) - 1;
                    if (mIdx >= 0 && mIdx < 12) monthlyIncomes[mIdx] = Convert.ToDecimal(r["total"]);
                }

                List<object> monthlyReportTable = new List<object>();
                int bestSavingMonthIdx = 0;
                decimal maxSavings = -99999999;
                decimal sumMonthlyExpense = 0;
                int monthsWithData = 0;

                string[] monthNames = CultureInfo.InvariantCulture.DateTimeFormat.MonthNames;

                for (int i = 0; i < 12; i++)
                {
                    decimal inc = monthlyIncomes[i];
                    decimal exp = monthlyExpenses[i];
                    decimal bal = inc - exp;
                    if (inc > 0 || exp > 0)
                    {
                        monthsWithData++;
                        sumMonthlyExpense += exp;
                    }
                    if (bal > maxSavings)
                    {
                        maxSavings = bal;
                        bestSavingMonthIdx = i;
                    }

                    monthlyReportTable.Add(new
                    {
                        month = monthNames[i],
                        income = inc,
                        expense = exp,
                        balance = bal,
                        status = bal >= 0 ? "Profit" : "Loss"
                    });
                }

                decimal avgMonthlyExpense = monthsWithData > 0 ? Math.Round(sumMonthlyExpense / monthsWithData, 2) : 0;
                decimal avgDailyExpense = Math.Round(totalExpense / 30, 2);

                var js = new JavaScriptSerializer();
                var result = new
                {
                    totalIncome = totalIncome,
                    totalExpense = totalExpense,
                    currentBalance = currentBalance,
                    totalTransactions = totalTransactions,
                    highestIncome = Convert.ToDecimal(maxIncomeObj),
                    highestExpense = Convert.ToDecimal(maxExpenseObj),
                    avgMonthlyExpense = avgMonthlyExpense,
                    avgDailyExpense = avgDailyExpense,
                    mostSpendingCategory = topCategoryObj != null ? topCategoryObj.ToString() : "N/A",
                    bestSavingMonth = monthNames[bestSavingMonthIdx],
                    categoryBreakdown = categoryBreakdown,
                    monthlyExpensesTrend = monthlyExpenses,
                    monthlyIncomesTrend = monthlyIncomes,
                    monthlyReportTable = monthlyReportTable
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
