import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useStore } from "@/store";
import { Mail, User } from "lucide-react";

export const PersonalInformation = () => {
  const user = useStore((store) => store.user);

  return (
    <>
      {/* Personal Information */}
      <h2 className="flex items-center gap-x-2 text-xl font-semibold">
        <User className="size-6 text-primary" />
        Información Personal
      </h2>
      <div className="w-full flex items-center gap-x-5">
        <Avatar className="size-28 ring-4 ring-purple-500">
          <AvatarImage src={user.picture} alt="User Profile Pic" />
          <AvatarFallback className="bg-transparent text-white text-3xl">
            {user.username[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-y-1">
          <p className="text-wrap font-semibold text-lg">{user.username}</p>
          <p className="text-muted-foreground flex items-center gap-x-2">
            <Mail className="size-5" /> {user.email}
          </p>
        </div>
      </div>
    </>
  );
};
