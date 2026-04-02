import React from 'react'
import type { Checkpoint } from '../../../shared/finetuning'

interface CheckpointTableProps {
  checkpoints: Checkpoint[]
}

export function CheckpointTable({ checkpoints }: CheckpointTableProps) {
  if (checkpoints.length === 0) {
    return <p className="text-text-muted text-sm">No checkpoints yet.</p>
  }
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-text-muted border-b border-border-subtle">
          <th className="text-left py-2 font-medium">Name</th>
          <th className="text-center py-2 font-medium">Epoch</th>
          <th className="text-center py-2 font-medium">Loss</th>
          <th className="text-left py-2 font-medium">Path</th>
        </tr>
      </thead>
      <tbody>
        {checkpoints.map((c, i) => (
          <tr key={i} className="border-b border-border-subtle/50">
            <td className="py-2 text-text-primary font-medium">{c.name}</td>
            <td className="py-2 text-center text-text-secondary">{c.epoch}</td>
            <td className="py-2 text-center text-accent-400">{c.loss.toFixed(3)}</td>
            <td className="py-2 text-text-muted font-mono">{c.path}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
