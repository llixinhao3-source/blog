import type { Project } from '../types';

export const projects: Project[] = [
  {
    id: 'esp32-s3-dev',
    title: 'ESP32-S3 智能硬件开发平台',
    description: '基于 ESP32-S3 的嵌入式开发项目，涵盖 WiFi 模块通信、双麦克风阵列调优、CH341 串口通信等核心技术实践。',
    category: 'hardware',
    techStack: ['ESP32-S3', 'C/C++', 'FreeRTOS', 'WiFi', 'I2S'],
    highlights: [
      '实现双麦克风阵列的 I2S 音频采集与降噪处理',
      '完成 WiFi 模块的配网与 MQTT 远程通信',
      '基于 CH341 实现 USB 转串口的高速数据传输',
    ],
  },
  {
    id: 'openclaw-integration',
    title: 'Openclaw 硬件集成与 AI 框架接入',
    description: '将 openclaw 系统通过 MCP 协议接入夏柔 AI 机器人框架，实现软硬件一体化智能交互。',
    category: 'hardware',
    techStack: ['ESP32-S3', 'Python', 'MCP', '夏柔AI'],
    highlights: [
      '设计并实现 MCP 协议适配层，打通硬件与 AI 框架的通信链路',
      '完成传感器数据采集与 AI 推理结果的实时交互闭环',
      '优化通信延迟，实现毫秒级指令响应',
    ],
  },
  {
    id: 'industrial-ai-detection',
    title: '工业级检测数据自动化处理',
    description: '结合 AI 算法开发与模型部署，全面提升检测数据的处理深度，实现工业级自动化检测流程。',
    category: 'ai',
    techStack: ['Python', 'PyTorch', 'ONNX', 'Docker', 'FastAPI'],
    highlights: [
      '设计端到端的检测数据处理管线，自动化率达到 95%',
      '完成模型的工业级部署与推理优化',
      '在远程办公模式下实现高效的跨团队协作',
    ],
  },
  {
    id: 'xiarou-ai-framework',
    title: '夏柔 AI 框架 SOP 总结与部署实践',
    description: '系统化梳理夏柔 AI 框架的标准操作流程，沉淀模型部署与推理优化的实战经验。',
    category: 'ai',
    techStack: ['Python', 'Docker', 'Kubernetes', 'REST API', 'WebSocket'],
    highlights: [
      '编写夏柔 AI 框架的完整 SOP 文档，覆盖部署、监控、回滚全流程',
      '实现模型服务的容器化部署与自动扩缩容',
      '建立模型性能基准测试体系，持续追踪推理性能',
    ],
  },
];