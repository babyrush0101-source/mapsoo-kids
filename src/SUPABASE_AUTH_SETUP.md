# Supabase Authentication Setup Guide

## ✅ 已完成的集成

项目已成功集成 Supabase 认证系统，包括：

### 1. Auth Context (`/components/auth-context.tsx`)
- ✅ 使用真实的 Supabase Auth API
- ✅ 支持电子邮件/密码登录
- ✅ 支持注册功能
- ✅ 支持 Google OAuth 登录
- ✅ 自动管理会话状态
- ✅ 监听认证状态变化

### 2. 登录模态框
- ✅ `AuthModal` - 在当前页面弹出，不跳转
- ✅ `AuthCard` - 可复用的登录/注册表单
- ✅ 半透明背景 + 毛玻璃效果
- ✅ ESC 键关闭
- ✅ 点击外部关闭

### 3. OAuth 回调处理
- ✅ `/components/auth/AuthCallback.tsx` - 处理 Google 登录重定向
- ✅ 自动路由 `/auth/callback`

### 4. 用户界面更新
- ✅ Navbar 显示用户头像和邮箱
- ✅ UserProfile 页面显示用户信息
- ✅ 所有组件适配 Supabase User 对象结构

## 🔧 Google OAuth 配置（需要手动完成）

要启用 Google 登录，请按以下步骤操作：

1. 访问 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 导航到 **Authentication > Providers**
4. 启用 **Google** provider
5. 按照 [官方文档](https://supabase.com/docs/guides/auth/social-login/auth-google) 配置：
   - 创建 Google Cloud 项目
   - 配置 OAuth 同意屏幕
   - 创建 OAuth 2.0 客户端 ID
   - 将客户端 ID 和密钥添加到 Supabase

⚠️ **重要**: 在 Google OAuth 配置中，添加重定向 URI：
```
https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
```

## 📝 使用方式

### 登录/注册

```tsx
import { useAuthModal } from './components/auth/auth-modal-context';

function MyComponent() {
  const { openAuthModal } = useAuthModal();
  
  return (
    <button onClick={() => openAuthModal('login')}>
      Login
    </button>
  );
}
```

### 获取当前用户

```tsx
import { useAuth } from './components/auth-context';

function MyComponent() {
  const { currentUser, isLoggedIn } = useAuth();
  
  return (
    <div>
      {isLoggedIn && (
        <p>Welcome, {currentUser?.user_metadata?.name || currentUser?.email}</p>
      )}
    </div>
  );
}
```

### 登出

```tsx
import { useAuth } from './components/auth-context';

function MyComponent() {
  const { logout } = useAuth();
  
  return (
    <button onClick={() => logout()}>
      Logout
    </button>
  );
}
```

## 🔑 Supabase User 对象结构

与之前的 mock 版本不同，Supabase User 对象结构如下：

```typescript
{
  id: string;                    // UUID
  email: string;
  created_at: string;            // ISO 日期字符串
  user_metadata: {               // 自定义数据
    name?: string;
    role?: string;
  };
  // ... 其他 Supabase 字段
}
```

## 📋 数据访问对比

| Mock 版本 | Supabase 版本 |
|----------|--------------|
| `currentUser.name` | `currentUser?.user_metadata?.name` |
| `currentUser.createdAt` | `currentUser?.created_at` |
| `currentUser.role` | `currentUser?.user_metadata?.role` |

## ⚠️ 注意事项

1. **邮箱确认**: Supabase 默认需要邮箱确认。如果未配置邮件服务，用户注册后会收到提示信息。
2. **管理员权限**: 当前通过 `admin@baseul.com` 邮箱或 `user_metadata.role === 'admin'` 判断管理员身份。
3. **社区功能**: 社区帖子和回复仍使用 localStorage，但用户 ID 来自 Supabase。

## 🎯 下一步

- [ ] 配置 Supabase Email Templates
- [ ] 设置 Google OAuth (如需要)
- [ ] 添加密码重置功能
- [ ] 添加邮箱变更功能
- [ ] 迁移社区数据到 Supabase 数据库
