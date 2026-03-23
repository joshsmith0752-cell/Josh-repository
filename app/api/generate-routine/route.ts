import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const { level, teamSize, teamName, sections, focus } = await req.json()

    const prompt = `You are an expert cheerleading coach and routine choreographer.

Create a detailed cheerleading routine plan for the following team:

- Team Name: ${teamName || 'The Team'}
- Competition Level: ${level}
- Team Size: ${teamSize} athletes
- Routine Sections to include: ${sections.join(', ')}
- Special Focus / Notes: ${focus || 'None'}

For each section, provide:
1. Duration (in counts or seconds)
2. Specific skills to include (appropriate for the level)
3. Formation description
4. Key coaching notes
5. ICU rule considerations for this level

Also provide:
- Overall routine flow and pacing tips
- Music tempo recommendation (BPM range)
- Safety reminders specific to this level
- What judges will be looking for at ${level}

Format your response clearly with section headers. Be specific and practical — this is for real competition use.`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ routine: text })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate routine' }, { status: 500 })
  }
}
