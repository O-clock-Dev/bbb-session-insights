import React, { useEffect, useRef } from "react";

const SearchBar = ({ searchTerm, setSearchTerm }) => {
    const inputRef = useRef(null);

    // "/" focuses the search from anywhere on the page, unless the user is already typing somewhere.
    useEffect(() => {
        const onKeyDown = (e) => {
            const target = e.target;
            const isTyping =
                target instanceof HTMLElement &&
                (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
            if (e.key === "/" && !isTyping && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, []);

    return (
        <form className="relative w-full sm:flex-1" role="search" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="default-search" className="sr-only">
                Rechercher une session
            </label>
            <svg
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 20 20"
            >
                <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                />
            </svg>
            <input
                ref={inputRef}
                type="text"
                id="default-search"
                autoComplete="off"
                className="block w-full h-10 pl-9 pr-10 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 transition-colors hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500 dark:hover:border-gray-500"
                placeholder="Rechercher une promotion, un cours, une date…"
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                }}
                onKeyDown={(e) => {
                    if (e.key === "Escape" && searchTerm) {
                        e.preventDefault();
                        setSearchTerm("");
                    }
                }}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                {searchTerm ? (
                    <button
                        type="button"
                        onClick={() => {
                            setSearchTerm("");
                            inputRef.current?.focus();
                        }}
                        className="inline-flex items-center justify-center w-6 h-6 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-white dark:hover:bg-gray-700"
                        aria-label="Effacer la recherche"
                        title="Effacer (Échap)"
                    >
                        <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="M18 6 6 18M6 6l12 12" />
                        </svg>
                    </button>
                ) : (
                    <kbd
                        className="hidden sm:inline-flex items-center h-5 px-1.5 rounded border border-gray-300 text-[11px] font-sans text-gray-400 dark:border-gray-600"
                        title="Appuyez sur / pour rechercher"
                    >
                        /
                    </kbd>
                )}
            </div>
        </form>
    );
};

export default SearchBar;
