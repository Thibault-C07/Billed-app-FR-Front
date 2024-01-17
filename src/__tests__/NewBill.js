/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import { ROUTES_PATH } from "../constants/routes.js";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("then mail icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);

      router();
      window.onNavigate(ROUTES_PATH.NewBill);

      await waitFor(() => screen.getByTestId("icon-mail"));
      const mailIcon = screen.getByTestId("icon-mail");

      expect(mailIcon.classList).toContain("active-icon");
    });
  });

  describe("When I upload a file", () => {
    test("then handleChangeFile should be triggered ", async () => {
      document.body.innerHTML = NewBillUI();

      // simuler une instance NewBill
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
      // simuler la fonction handleChangeFile
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));

      // récupérer l'input file
      await waitFor(() => screen.getByTestId("file"));
      const inputFile = screen.getByTestId("file");

      // lui attacher un event listener
      inputFile.addEventListener("change", handleChangeFile);

      // simuler le fichier à uploader
      const testFile = new File(["test"], "test.jpg", { type: "image/jpg" });

      console.log(JSON.stringify(testFile));
      // simuler l'envoi du fichier
      // userEvent.upload(inputFile, testFile)
      fireEvent.change(inputFile, {
        target: {
          files: [testFile],
        },
      });

      // the file name is displayed
      expect(screen.getByTestId("file").files[0].name).toBe("test.jpg");

      // handleChangeFile is called
      expect(handleChangeFile).toHaveBeenCalled();

      // check formdata values
      expect(inputFile.files[0]).toEqual(testFile);
    });

    test("then upload a wrong file should trigger an error", async () => {
      document.body.innerHTML = NewBillUI();

      // simuler une instance NewBill
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      // simuler la fonction handleChangeFile
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));

      // récupérer l'input file
      await waitFor(() => screen.getByTestId("file"));
      const inputFile = screen.getByTestId("file");

      // lui attacher un event listener
      inputFile.addEventListener("change", handleChangeFile);

      // simuler le fichier à uploader
      const testFile = new File(["test"], "test.pdf", { type: "document/pdf" });

      // surveiller la console
      const errorSpy = jest.spyOn(console, "error");

      // simuler l'envoi du fichier
      fireEvent.change(inputFile, {
        target: {
          files: [testFile],
        },
      });

      // error message is displayed
      expect(errorSpy).toHaveBeenCalledWith("wrong extension");
    });
  });
});

// POST integration test
describe("When I click on the submit button", () => {
  test("then it should create a new bill", () => {
    document.body.innerHTML = NewBillUI();

    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });

    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "a@a",
      })
    );

    const mockOnNavigate = jest.fn();

    const newBill = new NewBill({
      document,
      onNavigate: mockOnNavigate,
      store: mockStore,
      localStorage: window.localStorage,
    });

    // fill all the fields
    fireEvent.change(screen.getByTestId("expense-type"), {
      target: { value: "Transports" },
    });
    fireEvent.change(screen.getByTestId("expense-name"), {
      target: { value: "Vol Paris-Bordeaux" },
    });
    fireEvent.change(screen.getByTestId("datepicker"), {
      target: { value: "2023-04-01" },
    });
    fireEvent.change(screen.getByTestId("amount"), {
      target: { value: "42" },
    });
    fireEvent.change(screen.getByTestId("vat"), {
      target: { value: 18 },
    });
    fireEvent.change(screen.getByTestId("pct"), {
      target: { value: 20 },
    });
    fireEvent.change(screen.getByTestId("commentary"), {
      target: { value: "test bill" },
    });

    const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));

    const form = screen.getByTestId("form-new-bill");
    form.addEventListener("submit", handleSubmit);

    // submit the form
    fireEvent.submit(form);

    expect(handleSubmit).toHaveBeenCalled();

    expect(mockOnNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]);
  });
});
