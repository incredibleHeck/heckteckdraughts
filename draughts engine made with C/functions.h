/*
 * Copyright 1996-2004 by Michel D. Grimminck
 *
 * All Rights Reserved
 *
 * Permission to use, copy, modify, and distribute this software and its
 * documentation for any purpose and without fee is hereby granted,
 * provided that the above copyright notice appear in all copies and that
 * both that copyright notice and this permission notice appear in
 * supporting documentation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 */



#include "const.h"
extern void display_board(void);
extern void init_board(void);
extern void init_var(void);
extern int load_board(char *);
extern void print_movelist(int,int);
extern int move_list(int,int);
extern void do_move(char *);
extern void undo_move(char *);
extern int alfabeta(int,int,int,int,int,int,int *);
extern void print_pv(void);
extern void print_move(char *);
extern void fprint_move(FILE *,char *);
extern void init_stats(void);
extern void init_tstats(void);
extern void print_stats(void);
extern int evalboard(int,int,int,int *);
extern void movecopy(char *,char*);
extern int pn_search(int,int,int,int,int,int,int *,int *,int);
extern int do_pn_search(int,int,int,int);
extern void init_databases(void);
extern int database_valueWDL(int,int,int,int,int);
extern int theoretic(int);
extern int theoreticDTW(int);
extern void storemove(int,char *);
extern void init_hash(void);
extern int play(int,float,int,int);
extern int material(int);
extern int movecmp(char *,char *);
extern void compress_board(unsigned char*,BTYPE *);
extern void strong_compress_board(unsigned char *,BTYPE *);
extern void decompress_board(BTYPE *,unsigned char *);
extern int randomgame(int,int,int,int,int,int);
extern void set_pieces(void);
extern int quiet(int);
extern int has_promote(int);
extern void findkiller(int,int);
extern int dynamic(int,int);
extern void reverse_board(BTYPE *,BTYPE *);
extern void copy_board(BTYPE *,BTYPE *);
extern int check_database(char *,int,int);
extern int text_to_move(char *,int,char *);
extern unsigned int hash_key(int);
extern int active(int,int,int,int);
extern void init_book(void);
extern void book_info(void);
extern int try_book(int,int);
extern void store_history(char *,int,int);
extern void take_back(int);
extern void show_history(int);
extern int try_move(int,int,int);
extern void write_pdn(char *);
extern void write_pdn2(FILE *out,int);
extern void write_dw(char *);
extern void write_dw2(FILE *);
extern void save_board(int,char *);
extern void store_hash(int,int,int,int,char *);
extern retreive_hash(int,int *,int *,int *,char *);
extern void set_col(int,int);
extern void res_col(void);
extern void set_eval(void);
extern void set_position(int,int);
extern void init_tpat(void);
extern int tpat_reconize(int);
extern void plearn(int,int);
extern float alloc_time(int);
extern FILE *my_fopen(char *,char *);
extern int is_repetition(int);
extern void init_rephash(void);
extern char *neatNumber(DBINDEX);
extern DBINDEX db_count(int,int,int,int,int,int);
extern DBINDEX database_linear_index(int);
extern void mem64_test();
extern void mem64_exit();
extern void mem64_init(int);
extern int mem64_allocate(INT64);
extern char *mem64_pointer(int,INT64,int);
extern INT64 mem64_RAM();
extern void dprint( char* , ... );
extern void winprint( char* , ... );
extern void init_takeback(void);
extern void print_move_damExchange(char *,int);
extern void detectPatterns(BTYPE *);
extern void initDetectPatterns(void);
extern void init_history(void);
extern void print_xray(int);
extern void analyseGame(int,int,float,int,int);
extern int read_wingame(void);
extern void writeFen(FILE *,BTYPE *,int,int);
extern void write_pdnFen(char *);
extern void read_all_databases(int);
extern char *xread(char *,char *);
extern int databaseIsLoaded(int,int,int,int,int,int);
extern void countGame(int);
extern int bookLearn(int,int,int);
extern int bookLearn0(int);
extern void generate_breakthrough();
extern int breakthrough(int,int,int);
extern int btEval(int);
extern void loadBreakThrough();
extern int breakthroughBTM();
extern void readTestPositions();
extern void tryGlobalHash(int);
extern FILE *winGetFile();
extern char *database_short_name(int,int,int,int);
extern void decompressGZfile(char *,char *);
extern int database_valueDTW(int,int,int,int,int);
extern int database_nr(int, int,int,int,int, int,int);
