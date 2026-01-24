export const BASE_SCHEMA = [
    // Legacy renames (Best effort idempotent renames)
    // Tables
    `do $$ begin
    if to_regclass('security.profile') is not null and to_regclass('security.profiles') is null then
        alter table security.profile rename to profiles;
    end if;
end $$;`,
    `do $$ begin
    if to_regclass('security."user"') is not null and to_regclass('security.users') is null then
        alter table security."user" rename to users;
    end if;
end $$;`,
    `do $$ begin
    if to_regclass('security.user_profile') is not null and to_regclass('security.user_profiles') is null then
        alter table security.user_profile rename to user_profiles;
    end if;
end $$;`,
    `do $$ begin
    if to_regclass('security.object') is not null and to_regclass('security.objects') is null then
        alter table security.object rename to objects;
    end if;
end $$;`,
    `do $$ begin
    if to_regclass('security.method') is not null and to_regclass('security.methods') is null then
        alter table security.method rename to methods;
    end if;
end $$;`,
    `do $$ begin
    if to_regclass('security.permission_method') is not null and to_regclass('security.permission_methods') is null then
        alter table security.permission_method rename to permission_methods;
    end if;
end $$;`,
    `do $$ begin
    if to_regclass('security.audit_log') is not null and to_regclass('security.audit_logs') is null then
        alter table security.audit_log rename to audit_logs;
    end if;
end $$;`,
    `do $$ begin
    if to_regclass('security.password_reset') is not null and to_regclass('security.password_resets') is null then
        alter table security.password_reset rename to password_resets;
    end if;
end $$;`,
    `do $$ begin
    if to_regclass('security.one_time_code') is not null and to_regclass('security.one_time_codes') is null then
        alter table security.one_time_code rename to one_time_codes;
    end if;
end $$;`,
    `do $$ begin
    if to_regclass('security.user_device') is not null and to_regclass('security.user_devices') is null then
        alter table security.user_device rename to user_devices;
    end if;
end $$;`,

    // Columns renames
    `do $$ begin
    if exists (select 1 from information_schema.columns where table_schema='security' and table_name='users' and column_name='user_na')
         and not exists (select 1 from information_schema.columns where table_schema='security' and table_name='users' and column_name='username') then
        alter table security.users rename column user_na to username;
    end if;
end $$;`,
    `do $$ begin
    if exists (select 1 from information_schema.columns where table_schema='security' and table_name='users' and column_name='user_pw')
         and not exists (select 1 from information_schema.columns where table_schema='security' and table_name='users' and column_name='password') then
        alter table security.users rename column user_pw to password;
    end if;
end $$;`,
    `do $$ begin
    if exists (select 1 from information_schema.columns where table_schema='security' and table_name='users' and column_name='password_hash')
         and not exists (select 1 from information_schema.columns where table_schema='security' and table_name='users' and column_name='password') then
        alter table security.users rename column password_hash to password;
    end if;
end $$;`,
    `do $$ begin
    if exists (select 1 from information_schema.columns where table_schema='security' and table_name='users' and column_name='user_em')
         and not exists (select 1 from information_schema.columns where table_schema='security' and table_name='users' and column_name='email') then
        alter table security.users rename column user_em to email;
    end if;
end $$;`,
    `do $$ begin
    if exists (select 1 from information_schema.columns where table_schema='security' and table_name='profiles' and column_name='profile_na')
         and not exists (select 1 from information_schema.columns where table_schema='security' and table_name='profiles' and column_name='profile_name') then
        alter table security.profiles rename column profile_na to profile_name;
    end if;
end $$;`,
    `do $$ begin
    if exists (select 1 from information_schema.columns where table_schema='security' and table_name='objects' and column_name='object_na')
         and not exists (select 1 from information_schema.columns where table_schema='security' and table_name='objects' and column_name='object_name') then
        alter table security.objects rename column object_na to object_name;
    end if;
end $$;`,
    `do $$ begin
    if exists (select 1 from information_schema.columns where table_schema='security' and table_name='methods' and column_name='method_na')
         and not exists (select 1 from information_schema.columns where table_schema='security' and table_name='methods' and column_name='method_name') then
        alter table security.methods rename column method_na to method_name;
    end if;
end $$;`,
    `do $$ begin
    if exists (select 1 from information_schema.columns where table_schema='security' and table_name='methods' and column_name='tx_nu')
         and not exists (select 1 from information_schema.columns where table_schema='security' and table_name='methods' and column_name='tx') then
        alter table security.methods rename column tx_nu to tx;
    end if;
end $$;`,
    `do $$ begin
    if exists (select 1 from information_schema.columns where table_schema='security' and table_name='audit_logs' and column_name='time')
         and not exists (select 1 from information_schema.columns where table_schema='security' and table_name='audit_logs' and column_name='created_at') then
        alter table security.audit_logs rename column time to created_at;
    end if;
end $$;`,
    `do $$ begin
    if exists (select 1 from information_schema.columns where table_schema='security' and table_name='audit_logs' and column_name='object_na')
         and not exists (select 1 from information_schema.columns where table_schema='security' and table_name='audit_logs' and column_name='object_name') then
        alter table security.audit_logs rename column object_na to object_name;
    end if;
end $$;`,
    `do $$ begin
    if exists (select 1 from information_schema.columns where table_schema='security' and table_name='audit_logs' and column_name='method_na')
         and not exists (select 1 from information_schema.columns where table_schema='security' and table_name='audit_logs' and column_name='method_name') then
        alter table security.audit_logs rename column method_na to method_name;
    end if;
end $$;`,
    `do $$ begin
    if exists (select 1 from information_schema.columns where table_schema='security' and table_name='audit_logs' and column_name='tx_nu')
         and not exists (select 1 from information_schema.columns where table_schema='security' and table_name='audit_logs' and column_name='tx') then
        alter table security.audit_logs rename column tx_nu to tx;
    end if;
end $$;`,
    `do $$ begin
    if exists (select 1 from information_schema.columns where table_schema='security' and table_name='password_resets' and column_name='reset_id')
         and not exists (select 1 from information_schema.columns where table_schema='security' and table_name='password_resets' and column_name='password_reset_id') then
        alter table security.password_resets rename column reset_id to password_reset_id;
    end if;
end $$;`,
    `do $$ begin
    if exists (select 1 from information_schema.columns where table_schema='security' and table_name='one_time_codes' and column_name='code_id')
         and not exists (select 1 from information_schema.columns where table_schema='security' and table_name='one_time_codes' and column_name='one_time_code_id') then
        alter table security.one_time_codes rename column code_id to one_time_code_id;
    end if;
end $$;`,
    `do $$ begin
    if exists (select 1 from information_schema.columns where table_schema='security' and table_name='user_devices' and column_name='device_id')
         and not exists (select 1 from information_schema.columns where table_schema='security' and table_name='user_devices' and column_name='user_device_id') then
        alter table security.user_devices rename column device_id to user_device_id;
    end if;
end $$;`,

    // Schema and Base Tables
    `create schema if not exists security;`,
    `create table if not exists security.profiles (\n  profile_id bigint generated by default as identity primary key\n);`,
    `create table if not exists security.users (\n  user_id bigint generated by default as identity primary key,\n  username text not null unique,\n  password text not null\n);`,
    `create table if not exists security.user_profiles (\n  user_id bigint not null references security.users(user_id) on delete cascade,\n  profile_id bigint not null references security.profiles(profile_id) on delete cascade,\n  primary key (user_id, profile_id)\n);`,

    // User profile uniqueness enforcement
    `do $$ begin
    if to_regclass('security.user_profiles') is not null then
        delete from security.user_profiles a
        using security.user_profiles b
        where a.user_id = b.user_id and a.ctid < b.ctid;
    end if;
end $$;`,
    `create unique index if not exists uq_user_profiles_user_id on security.user_profiles(user_id);`,

    `create table if not exists security.objects (\n  object_id bigint generated by default as identity primary key,\n  object_name text not null unique\n);`,
    `create table if not exists security.methods (\n  method_id bigint generated by default as identity primary key,\n  object_id bigint not null references security.objects(object_id) on delete cascade,\n  method_name text not null,\n  tx integer not null,\n  constraint uq_method_object unique (object_id, method_name),\n  constraint uq_method_tx unique (tx),\n  constraint ck_method_tx_positive check (tx > 0)\n);`,
    `create table if not exists security.permission_methods (\n  profile_id bigint not null references security.profiles(profile_id) on delete cascade,\n  method_id bigint not null references security.methods(method_id) on delete cascade,\n  primary key (profile_id, method_id)\n);`,

    `create index if not exists ix_user_profiles_profile_id on security.user_profiles(profile_id);`,
    `create index if not exists ix_methods_object_id on security.methods(object_id);`,
    `create index if not exists ix_permission_methods_method_id on security.permission_methods(method_id);`,

    // Operation columns base
    `alter table security.profiles add column if not exists profile_name text;`,
    `create unique index if not exists uq_profiles_profile_name on security.profiles(profile_name) where profile_name is not null;`,

    `alter table security.users add column if not exists is_active boolean not null default true;`,
    `alter table security.users add column if not exists created_at timestamptz not null default now();`,
    `alter table security.users add column if not exists updated_at timestamptz not null default now();`,
    `alter table security.users add column if not exists last_login_at timestamptz;`,

    `do $$ begin\n  alter table security.methods add constraint ck_method_tx_positive check (tx > 0);\nexception when duplicate_object then null; end $$;`,
    `do $$ begin\n  alter table security.users add constraint ck_users_username_not_blank check (length(btrim(username)) > 0);\nexception when duplicate_object then null; end $$;`,
]
