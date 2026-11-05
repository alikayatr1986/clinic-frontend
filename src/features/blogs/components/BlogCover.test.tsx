import { fireEvent, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { themedRender } from "@/test/utils";
import { BlogCover } from "./BlogCover";

it("shows a placeholder for a failed image and loads a new URL", () => {
  const cover = { url: "/a.jpg", alt: "Cover", width: 100, height: 100, focal_point: { x: 0.5, y: 0.5 } };
  const view = themedRender(<BlogCover cover={cover} />);
  fireEvent.error(screen.getByRole("img"));
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
  view.rerender(<BlogCover cover={{ ...cover }} />);
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
  view.rerender(<BlogCover cover={{ ...cover, url: "/b.jpg" }} />);
  expect(screen.getByRole("img")).toHaveAttribute("src", "/b.jpg");
  view.rerender(<BlogCover cover={cover} />);
  expect(screen.getByRole("img")).toHaveAttribute("src", "/a.jpg");
});
