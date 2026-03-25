import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { homeCategories } from "../utils";
import { useNavigate } from "@tanstack/react-router";

type Props = {
  activeCategory: string | undefined;
};

/**
 * Horizontal row of category filter buttons for the posts feed.
 * Highlights the currently active category and navigates on click.
 *
 * Test cases:
 * - Renders one button per entry in homeCategories
 * - Button matching activeCategory gets violet/primary highlight styles
 * - Clicking a button navigates to "/?category=<lowercased name>"
 * - No button is highlighted when activeCategory is undefined
 */
export const FeedCategoryFilter = ({ activeCategory }: Props) => {
  const navigate = useNavigate();

  return (
    <div className="w-full mt-10 flex gap-x-2 flex-wrap gap-y-2 justify-center sm:justify-start">
      {homeCategories.map(({ name, Icon }) => (
        <Button
          key={name}
          size={"lg"}
          variant={"outline"}
          className={cn(
            "cursor-pointer hover:scale-105 hover:text-violet-400 transition-all hover:border hover:border-primary/70 px-5 hover:bg-input/40",
            {
              "text-violet-400 border-primary hover:text-violet-400 hover:border-primary hover:bg-input/30":
                activeCategory
                  ? activeCategory === name.toLowerCase()
                  : name.toLowerCase() === "todo",
            },
          )}
          onClick={() =>
            navigate({
              to: "/",
              search: (prev) => ({
                ...prev,
                category:
                  name.toLowerCase() === "todo"
                    ? undefined
                    : name.toLowerCase(),
              }),
            })
          }
        >
          <Icon />
          {name}
        </Button>
      ))}
    </div>
  );
};
