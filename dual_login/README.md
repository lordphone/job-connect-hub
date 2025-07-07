pip install supabase

# demo-table
# id, created_at and first_name text

pip install fastapi uvicorn
pip install jinja2
pip install python-multipart
pip install email-validator
pip install python-dotenv

SQL Query for new table:
create table employees (
  id serial primary key,
  first_name text not null,
  last_name text not null,
  email text unique not null,
  salary numeric not null,
  image_url text,
  is_active boolean default true
);

For bucket we need to add this policy:
(
  auth.role() = 'anon'
)



