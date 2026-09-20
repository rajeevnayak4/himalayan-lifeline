import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";

export async function getMockUser() {
  const cookieStore = await cookies();
  const role = cookieStore.get("hl_role")?.value || "trekker";

  try {
    let user = await prisma.user.findFirst({ where: { role } });
    
    // If no user exists for this role, automatically create one so the demo doesn't crash!
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: `Demo ${role}`,
          phone: "+977 0000000000",
          role: role,
        }
      });
    }
    
    return {
      id: user.id,
      name: user.name,
      role: user.role,
      phone: user.phone,
    };
  } catch (e) {
    // Ultimate fallback if DB is completely unreachable
    return {
      id: "fallback-id",
      name: "Offline Fallback User",
      role,
      phone: "+977 0000000000",
    };
  }
}
