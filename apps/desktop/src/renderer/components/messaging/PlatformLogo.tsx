import React from 'react'
import { siTelegram, siDiscord, siWechat, siWhatsapp, siLine } from 'simple-icons'
import type { IMPlatform } from '../../../shared/messaging'
import { IM_PLATFORM_COLORS } from '../../../shared/messaging'

// Slack hashtag mark — previously in simple-icons (MIT), reproduced here
const SLACK_PATH =
  'M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z'

// Feishu/Lark — chat-cloud shape (generic, brand-colored)
const FEISHU_PATH =
  'M12 0C5.373 0 0 4.925 0 11c0 3.234 1.46 6.14 3.786 8.17L3 24l4.677-2.338C9.019 22.508 10.48 23 12 23c6.627 0 12-4.925 12-11S18.627 0 12 0z'

// DingTalk — phone / lightning bolt mark (generic, brand-colored)
const DINGTALK_PATH =
  'M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-.75 17.25l-3-7.5h2.25l1.5-3.75 3 7.5h-2.25l-1.5 3.75z'

const ICON_MAP: Record<IMPlatform, string> = {
  telegram: siTelegram.path,
  slack: SLACK_PATH,
  discord: siDiscord.path,
  feishu: FEISHU_PATH,
  dingtalk: DINGTALK_PATH,
  wechat_work: siWechat.path,
  whatsapp: siWhatsapp.path,
  line: siLine.path,
}

interface PlatformLogoProps {
  platform: IMPlatform
  size?: number
  className?: string
}

export function PlatformLogo({ platform, size = 18, className = '' }: PlatformLogoProps) {
  const path = ICON_MAP[platform]
  const color = `#${IM_PLATFORM_COLORS[platform]}`
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={color}
      aria-hidden="true"
      className={className}
    >
      <path d={path} />
    </svg>
  )
}
