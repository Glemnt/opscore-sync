-- Allow newly authenticated users to insert their own app_users row
CREATE POLICY "Users can insert own app_user"
ON public.app_users
FOR INSERT
TO authenticated
WITH CHECK (auth_user_id = auth.uid());

-- Allow newly authenticated users to insert their own role
CREATE POLICY "Users can insert own role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() AND role = 'user'::app_role);