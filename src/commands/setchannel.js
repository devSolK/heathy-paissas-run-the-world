import { ensureBoardInChannel } from "../board.js";
import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("setchannel")
  .setDescription("이제부터 이 채널은 내가 접수한다!")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

export async function execute(itx) {
  if (!itx.channel?.isTextBased?.() || itx.channel.isThread()) {
    await itx.reply({
      content: "이 봇은 텍스트 채널에서만 사용할 수 있어요.",
      ephemeral: true,
    });
    return;
  }
  const boardMsg = await ensureBoardInChannel(itx.channel);
  await itx.reply({
    content: `이제부터 이 채널은 내가 접수한다!`,
    ephemeral: true,
  });
}
