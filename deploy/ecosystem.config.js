// PM2 process definition for the Azure Creative Platform.
// Keeps `next start` alive, restarts on crash and on server reboot.
//
//   pm2 start deploy/ecosystem.config.js
//   pm2 save && pm2 startup   (follow the printed command once)
//
// Adjust `cwd` to wherever you cloned the repo.
module.exports = {
  apps: [
    {
      name: "azure-platform",
      cwd: "/home/azure/azure-Tender",
      script: "npm",
      args: "start",
      instances: 1,
      autorestart: true,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
  ],
};
