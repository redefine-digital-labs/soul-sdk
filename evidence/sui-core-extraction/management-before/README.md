# soul-sdk

SDK：无权威状态的客户端工具。按需读取、构造交易、错误处理与恢复

维护入口：[MODULE](MODULE.md)、[Agent 边界](AGENTS.md)、[兼容](COMPATIBILITY.md)、[运行恢复](RUNBOOK.md)。机器配置：[module.json](module.json)。

实际施工：边界与维护契约已建；SDK实现尚未迁入。详细证据状态见 module.json；独立部署与远端CI尚未验收。
推荐岗位 LUQI；原 Owner 不变。实际维护人与独立验收人未确认处为 pending，角色名不是账号或审计资格。

```sh
python3 scripts/ci.py
python3 scripts/ci.py --product
python3 scripts/ci.py --release-ready
```

默认CI检查维护契约；产品命令未登记时 `--product` 拒绝通过。准备门禁不部署或签名。
