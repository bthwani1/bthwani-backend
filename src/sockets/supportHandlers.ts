import SupportTicket from "../models/support/SupportTicket";

export async function handleSupportJoin(socket: any, ticketId: string) {
  const uid: string | undefined = socket.data.uid;
  const role: string = socket.data.role || "customer";
  if (!uid || !ticketId) return;

  const t = await SupportTicket.findById(ticketId).lean();
  if (!t) return;

  const isOwner = t.requester.userId === uid;
  const isStaff = ["admin", "superadmin", "agent", "support"].includes(role);
  if (!isOwner && !isStaff) return;

  socket.join(`ticket_${ticketId}`);
}

export function registerSupportSocket(io: any) {
  io.of("/").on("connection", (socket: any) => {
    socket.on("support:join", ({ ticketId }: { ticketId: string }) =>
      handleSupportJoin(socket, ticketId)
    );
    socket.on("support:leave", ({ ticketId }: { ticketId: string }) => {
      if (ticketId) socket.leave(`ticket_${ticketId}`);
    });
  });
}
