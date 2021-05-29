compiler: frame.o lexAnalyze.o parse.o translate.o tree.o printtree.o temp.o escape.o env.o types.o y.tab.o absyn.o symbol.o table.o lex.yy.o errormsg.o util.o semantic.o 
	cc -o compiler -g frame.o lexAnalyze.o parse.o translate.o tree.o temp.o escape.o env.o types.o y.tab.o absyn.o symbol.o table.o lex.yy.o errormsg.o util.o semantic.o printtree.o

lexAnalyze.o: lexAnalyze.c errormsg.h util.h
	cc -g -c lexAnalyze.c

parse.o: parse.c parse.h
	cc -g -c parse.c

semantic.o: semantic.c semantic.h wasm_frame.c
	cc -g -c semantic.c wasm_frame.c

translate.o: translate.c translate.h
	cc -g -c translate.c

tree.o: tree.c tree.h
	cc -g -c tree.c

printtree.o: printtree.c printtree.h
	cc -g -c printtree.c

frame.o: wasm_frame.c wasm_frame.h frame.h 
	cc -o frame.o -g -c wasm_frame.c

temp.o: temp.c temp.h
	cc -g -c temp.c

escape.o: escape.c escape.h
	cc -g -c escape.c

env.o: env.c env.h
	cc -g -c env.c

types.o: types.c types.h
	cc -g -c types.c

y.tab.o: y.tab.c
	cc -g -c -DYYERROR_VERBOSE -DYYDEBUG=1 y.tab.c

y.tab.c: lang.y
	yacc -dv -v lang.y

y.tab.h: y.tab.c
	echo "created y.tab.h"

absyn.o: absyn.c absyn.h
	cc -g -c absyn.c

table.o: table.c table.h
	cc -g -c table.c

symbol.o: symbol.c symbol.h table.h
	cc -g -c symbol.c

errormsg.o: errormsg.c errormsg.h util.h
	cc -g -c errormsg.c

lex.yy.o: lex.yy.c errormsg.h util.h
	cc -g -c lex.yy.c

lex.yy.c: lang.l
	lex -w lang.l

util.o: util.c util.h
	cc -g -c util.c

clean: 
	rm -f compiler lexAnalyze.o parse.o semantic.o translate.o tree.o printtree.o frame.o temp.o escape.o env.o types.o y.tab.o absyn.o symbol.o table.o lex.yy.o errormsg.o util.o
