import { Theme } from "@radix-ui/themes";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";

export const renderInTheme = (ui: ReactElement) => render(<Theme>{ui}</Theme>);
