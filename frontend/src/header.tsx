import Name from "../src/header/name";
import SelectArea from "../src/header/midsection";
import Details from "../src/header/endsection";

function App() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-4 sm:gap-6 sm:px-6 dark:border-slate-700 dark:bg-slate-900">
      <Name />
      <div className="hidden min-w-0 flex-1 justify-center sm:flex">
        <SelectArea />
      </div>
      <Details />
    </header>
  );
}

export default App;
