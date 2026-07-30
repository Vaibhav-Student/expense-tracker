using System;
using System.Data;
using System.IO;
using System.Web;
using System.Web.Script.Serialization;
using MySql.Data.MySqlClient;
using Expence_Traker.Helpers;

namespace Expence_Traker.Handlers
{
    public class CategoryHandler : IHttpHandler
    {
        public void ProcessRequest(HttpContext context)
        {
            context.Response.ContentType = "application/json";
            string action = context.Request.QueryString["action"] ?? context.Request.Form["action"];

            if (string.IsNullOrEmpty(action) && context.Request.HttpMethod == "POST")
            {
                // Check JSON body if form data is empty
                using (var reader = new StreamReader(context.Request.InputStream))
                {
                    string jsonStr = reader.ReadToEnd();
                    if (!string.IsNullOrEmpty(jsonStr))
                    {
                        var js = new JavaScriptSerializer();
                        var dict = js.Deserialize<System.Collections.Generic.Dictionary<string, object>>(jsonStr);
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
                if (string.IsNullOrEmpty(action) || action.Equals("get", StringComparison.OrdinalIgnoreCase))
                {
                    GetCategories(context);
                }
                else if (action.Equals("add", StringComparison.OrdinalIgnoreCase))
                {
                    AddCategory(context);
                }
                else if (action.Equals("update", StringComparison.OrdinalIgnoreCase))
                {
                    UpdateCategory(context);
                }
                else if (action.Equals("delete", StringComparison.OrdinalIgnoreCase))
                {
                    DeleteCategory(context);
                }
                else
                {
                    GetCategories(context);
                }
            }
            catch (Exception ex)
            {
                context.Response.Write(new JavaScriptSerializer().Serialize(new { success = false, message = ex.Message }));
            }
        }

        private void GetCategories(HttpContext context)
        {
            string search = context.Request.QueryString["search"];
            string sql = "SELECT * FROM categories";
            MySqlParameter[] p = null;

            if (!string.IsNullOrEmpty(search))
            {
                sql += " WHERE name LIKE @search OR description LIKE @search";
                p = new MySqlParameter[] { new MySqlParameter("@search", "%" + search + "%") };
            }

            sql += " ORDER BY id DESC";
            DataTable dt = DbHelper.ExecuteQuery(sql, p);
            string json = DbHelper.DataTableToJson(dt);
            context.Response.Write(json);
        }

        private void AddCategory(HttpContext context)
        {
            string name = GetParam(context, "name");
            string icon = GetParam(context, "icon") ?? "📦";
            string color = GetParam(context, "color") ?? "Blue";
            string description = GetParam(context, "description") ?? "";

            if (string.IsNullOrEmpty(name))
            {
                context.Response.Write(new JavaScriptSerializer().Serialize(new { success = false, message = "Category name is required." }));
                return;
            }

            string sql = "INSERT INTO categories (name, icon, color, description, status) VALUES (@name, @icon, @color, @desc, 'Active')";
            MySqlParameter[] parameters = new MySqlParameter[]
            {
                new MySqlParameter("@name", name),
                new MySqlParameter("@icon", icon),
                new MySqlParameter("@color", color),
                new MySqlParameter("@desc", description)
            };

            long newId = DbHelper.ExecuteInsertAndGetId(sql, parameters);
            context.Response.Write(new JavaScriptSerializer().Serialize(new { success = true, id = newId, message = "Category added successfully." }));
        }

        private void UpdateCategory(HttpContext context)
        {
            int id = Convert.ToInt32(GetParam(context, "id"));
            string name = GetParam(context, "name");
            string icon = GetParam(context, "icon");
            string color = GetParam(context, "color");
            string description = GetParam(context, "description");
            string status = GetParam(context, "status") ?? "Active";

            string sql = "UPDATE categories SET name=@name, icon=@icon, color=@color, description=@desc, status=@status WHERE id=@id";
            MySqlParameter[] parameters = new MySqlParameter[]
            {
                new MySqlParameter("@id", id),
                new MySqlParameter("@name", name),
                new MySqlParameter("@icon", icon),
                new MySqlParameter("@color", color),
                new MySqlParameter("@desc", description),
                new MySqlParameter("@status", status)
            };

            int rows = DbHelper.ExecuteNonQuery(sql, parameters);
            context.Response.Write(new JavaScriptSerializer().Serialize(new { success = rows > 0, message = rows > 0 ? "Category updated." : "Category not found." }));
        }

        private void DeleteCategory(HttpContext context)
        {
            int id = Convert.ToInt32(GetParam(context, "id"));
            string sql = "DELETE FROM categories WHERE id=@id";
            MySqlParameter[] parameters = new MySqlParameter[]
            {
                new MySqlParameter("@id", id)
            };

            int rows = DbHelper.ExecuteNonQuery(sql, parameters);
            context.Response.Write(new JavaScriptSerializer().Serialize(new { success = rows > 0, message = rows > 0 ? "Category deleted." : "Category not found." }));
        }

        private string GetParam(HttpContext context, string key)
        {
            if (context.Items.Contains(key)) return context.Items[key]?.ToString();
            return context.Request.Form[key] ?? context.Request.QueryString[key];
        }

        public bool IsReusable => false;
    }
}
