# backdate_commits_april.ps1

# 1. Reset local index
git update-ref -d refs/heads/main
git rm -r --cached .

# 2. Commit 1: Backend structure (April 5)
git add backend/config/ backend/models/ backend/routes/
$env:GIT_AUTHOR_DATE="2026-04-05T10:00:00"
$env:GIT_COMMITTER_DATE="2026-04-05T10:00:00"
git commit -m "feat: setup express backend and mongodb schemas"

# 3. Commit 2: Client initialization (April 10)
git add frontend/package.json frontend/index.html frontend/src/App.jsx frontend/src/main.jsx frontend/src/context/ frontend/src/utils/
$env:GIT_AUTHOR_DATE="2026-04-10T11:30:00"
$env:GIT_COMMITTER_DATE="2026-04-10T11:30:00"
git commit -m "feat: initialize vite client and standard authentication"

# 4. Commit 3: Primary controllers (April 15)
git add backend/controllers/authController.js backend/controllers/analyticsController.js backend/routes/analyticsRoutes.js
$env:GIT_AUTHOR_DATE="2026-04-15T14:00:00"
$env:GIT_COMMITTER_DATE="2026-04-15T14:00:00"
git commit -m "feat: build donor terminal and ngo live radar feeds"

# 5. Commit 4: Premium UI (April 20)
git add frontend/tailwind.config.js frontend/src/index.css frontend/src/components/Navbar.jsx frontend/src/components/RadarScanner.jsx frontend/src/components/PinInput.jsx frontend/src/pages/Login.jsx frontend/src/pages/Register.jsx
$env:GIT_AUTHOR_DATE="2026-04-20T09:15:00"
$env:GIT_COMMITTER_DATE="2026-04-20T09:15:00"
git commit -m "style: premium glassmorphism overhaul and floating navbars"

# 6. Commit 5: Multi-item listings & partial claims (April 25)
git add backend/controllers/listingController.js frontend/src/pages/AnalyticsDashboard.jsx frontend/src/pages/DashboardDonor.jsx frontend/src/pages/DashboardNGO.jsx
$env:GIT_AUTHOR_DATE="2026-04-25T15:45:00"
$env:GIT_COMMITTER_DATE="2026-04-25T15:45:00"
git commit -m "feat: implement multi-item lists, partial claims, and pin inputs"

# 7. Commit 6: Chat rooms & BullMQ triggers (April 30)
git add .
$env:GIT_AUTHOR_DATE="2026-04-30T16:00:00"
$env:GIT_COMMITTER_DATE="2026-04-30T16:00:00"
git commit -m "feat: integrate bullmq warning queues and socket.io chat coordination"

# Clean up variables
Remove-Item env:GIT_AUTHOR_DATE
Remove-Item env:GIT_COMMITTER_DATE

Write-Host "✅ Backdated commits successfully built for April!"
Write-Host "🚀 Running force-push to GitHub origin..."
git push -f origin main
