# 原 DOF-001 / P01 / P09 附件：SDK 有限离线候选

原 Owner、验收者、里程碑及状态保持；本附件不另建任务表或授予放行。阶段为 Code/Build/Test，状态为进行中；只验证隔离候选。已按 manage-soulidity-phases 读取 actual AGENTS/PROJECT_MEMORY/CURRENT/单一handoff；未写这些文件。手册v1.0，适用章节1–4、5–7、8.3/8.4、9、12；OPERATING_MODEL第8节及评审模板已读。

| 检查域 | 结论 | 证据 / 剩余 |
| --- | --- | --- |
| 管理与产品原旅程 | 通过（有限候选范围） | 八个原函数名保留；Soul资产与Collection Right旅程区分；UI_MAPPING逐原调用方记录。完整UI采用待核验。 |
| 敏捷与验收 | 通过（有限候选范围） | SPEC/PLAN/result；三轮内源码与目标检查收敛；不关闭完整产品目标。 |
| DevOps与恢复 | 通过（有限候选范围） | 固定Root离线依赖；源码/ABI/锁/日志hash；独立baseline；181生产guard零漂移。未部署、未安装。 |
| 支付与资金 | 通过（无资金执行的形状检查） | 真实Transaction精确Coin<C>merge/split/full消费及余额边界；总额/报价需来自实际独立协议读取。费用/余额/归属/结算链上真实性待核验。 |
| 金融模型/DeFi | 不适用 | 本轮没有借贷、AMM、收益模型或价格/舍入政策修改；SDK不发明费用公式。 |
| 共用合约安全 | 通过（适配范围） | 32byte承诺、u64、ID、重复Coin拒绝；实际ABI参数绑定。签名重放/故障恢复/UI未验证。 |
| Ethereum/EVM | 不适用 | 本轮仅Sui离线构造。 |
| Sui Move专项 | 通过（接口/构造范围） | owned Soul byvalue；Listing/Config<C>；Clock；CAS；Collection Factory/Right policy/Kiosk/Account；无RPC/type origin解析。链执行待核验。 |
| 治理/升级/锁 | 待核验（未执行） | explicit目标不证明Config角色/Publisher/latestCap/升级治理部署；无权限变更或签名。多签/时间锁/immutability不在本轮检查结论中。 |
| 运行/监控/退出 | 部分通过 / 待核验 | 源码/ABI证明取消与terminal delete不需要Config，permissionless terminal形状保留。真实pausedexit、event/index/readback与未知交易恢复待后续原旅程检查。 |

资产与信任边界：Soul买方成为发送者；Collection Right通过原Core Kiosk/Account路径交割。显式参数只作离线客户端校验；不证明实际钱包控制权、链上余额、共享状态或签名授权。候选测试使用虚构但合法格式的对象/包ID，无接受过的部署目标。

当前G1/G2仅有限源码/unsigned形状证据；G3独立审查需由原验收责任复核，完整Core预算仍有父任务报告的1FAIL。G4/G5未执行。未部署，未对外消息，未付款，无钱包。恢复为保留生产SDK与独立baseline，无链上回滚承诺。

下一步由既有Owner/父任务在原记录承接：复核这份候选，收敛预算与coherent身份/配置/协议门禁，再完成UI映射、Collection自动buyer pair/reprice、原操作链上回归。实际放行仍按已有用户授权；本附件不申请或假定新授权。
