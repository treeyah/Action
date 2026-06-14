#include <iostream>
#include <string>
#include <vector>
#include <map>
#include <cstdio>
#include <ctime>
#include <cstdlib>

using namespace std;

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
// On the web, input() reads from an inline field in the output area instead of
// stdin. This awaits the page (via ASYNCIFY) until the user submits a line.
EM_ASYNC_JS(char *, web_read_line, (), {
    const answer = await Module.readLine();
    return stringToNewUTF8(answer);
});
#endif

int main() {
    string c;
    vector<string> program;
    map<string, string> vars;

    srand(time(0));

    while (true) {
        getline(cin, c);

        if (c == "exit()") {
            break;
        }
        else if (c == "clear()") {
            program.clear();
            cout << "Program cleared.\n";
        }
        else if (c == "list()") {
            for (int i = 0; i < program.size(); i++) {
                cout << i << ": " << program[i] << "\n";
            }
        }
        else if (c == "run()") {

            int repeatCount = 1;

            for (string line : program) {

                if (line.find("repeat(") == 0) {
                    sscanf(line.c_str(), "repeat(%d)", &repeatCount);
                }

                else if (line.find("write(") == 0) {
                    for (int i = 0; i < repeatCount; i++) {
                        cout << line.substr(6, line.size() - 7);
                    }
                    repeatCount = 1;
                }

                else if (line.find("add(") == 0) {
                    int a, b;
                    sscanf(line.c_str(), "add(%d+%d)", &a, &b);

                    for (int i = 0; i < repeatCount; i++) {
                        cout << a + b;
                    }

                    repeatCount = 1;
                }

                else if (line.find("minus(") == 0) {
                    int a, b;
                    sscanf(line.c_str(), "minus(%d-%d)", &a, &b);

                    for (int i = 0; i < repeatCount; i++) {
                        cout << a - b;
                    }

                    repeatCount = 1;
                }

                else if (line.find("times(") == 0) {
                    int a, b;
                    sscanf(line.c_str(), "times(%d*%d)", &a, &b);

                    for (int i = 0; i < repeatCount; i++) {
                        cout << a * b;
                    }

                    repeatCount = 1;
                }

                else if (line.find("divide(") == 0) {
                    int a, b;
                    sscanf(line.c_str(), "divide(%d/%d)", &a, &b);

                    if (b == 0) {
                        cout << "Error: Cannot divide by zero.";
                    }
                    else {
                        for (int i = 0; i < repeatCount; i++) {
                            cout << a / b;
                        }
                    }

                    repeatCount = 1;
                }

                else if (line.find("set(") == 0) {
                    string inside = line.substr(4, line.size() - 5);
                    int equals = inside.find('=');

                    string name = inside.substr(0, equals);
                    string value = inside.substr(equals + 1);

                    vars[name] = value;
                }

                else if (line.find("get(") == 0) {
                    string name = line.substr(4, line.size() - 5);

                    for (int i = 0; i < repeatCount; i++) {
                        cout << vars[name];
                    }

                    repeatCount = 1;
                }

                else if (line.find("random(") == 0) {
                    int min, max;
                    sscanf(line.c_str(), "random(%d,%d)", &min, &max);

                    int result = rand() % (max - min + 1) + min;

                    for (int i = 0; i < repeatCount; i++) {
                        cout << result;
                    }

                    repeatCount = 1;
                }

                else if (line == "newline()") {
                    for (int i = 0; i < repeatCount; i++) {
                        cout << "\n";
                    }

                    repeatCount = 1;
                }

                else if (line == "input()") {
                    string value;
#ifdef __EMSCRIPTEN__
                    cout.flush();
                    char *p = web_read_line();
                    value = p;
                    free(p);
#else
                    getline(cin, value);
#endif
                    vars["input"] = value;
                }
            }

            cout << "\nProgram finished.\n";
        }
        else {
            program.push_back(c);
        }
    }

    return 0;
}